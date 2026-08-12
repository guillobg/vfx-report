import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const RESEND_API_KEY = process.env.RESEND_API_KEY; // Optional: for sending emails

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

function getLastFriday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  const lastFriday = new Date(now);
  lastFriday.setDate(now.getDate() - diff);
  return lastFriday.toISOString().split("T")[0];
}

async function sendReminderEmail(to: string, name: string, projects: string[], weekEnding: string, appUrl: string) {
  if (!RESEND_API_KEY) return { sent: false, reason: "No RESEND_API_KEY configured" };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "VFX Reports <onboarding@resend.dev>",
      to: [to],
      subject: `⚠️ Recordatorio: Informe VFX semanal pendiente (${weekEnding})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Recordatorio de Informe Semanal VFX</h2>
          <p>Hola <strong>${name}</strong>,</p>
          <p>No hemos recibido tu informe de estado VFX para la semana que terminó el <strong>${weekEnding}</strong>.</p>
          <p>Proyectos pendientes: <strong>${projects.join(", ")}</strong></p>
          <p>Por favor envíalo antes de posible:</p>
          <p style="margin: 20px 0;">
            <a href="${appUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Enviar Informe →
            </a>
          </p>
          <p style="color: #666; font-size: 12px;">
            Este es un recordatorio automático del sistema VFX Status Report — Amazon International Originals.
          </p>
        </div>
      `,
    }),
  });

  const result = await res.json();
  return { sent: res.ok, result };
}

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "vfx-cron-2026";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const lastFriday = getLastFriday();
    const appUrl = process.env.NEXTAUTH_URL || "https://main.dj7gpiydmt385.amplifyapp.com";

    // 1. Get all active users
    const usersRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tblSqxvPfd0dHgCFm?filterByFormula=${encodeURIComponent("{Active} = TRUE()")}`,
      { headers }
    );
    const usersData = await usersRes.json();
    const users = usersData.records || [];

    // 2. Get all reports for last week
    const reportsRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tbldpQLs1Zh9vxTkr?filterByFormula=${encodeURIComponent(`{Week Ending} = '${lastFriday}'`)}`,
      { headers }
    );
    const reportsData = await reportsRes.json();
    const reports = reportsData.records || [];

    // 3. Find users who didn't submit
    const submittedEmails = reports.map((r: any) => r.fields["Submitted By"]);
    const missingUsers = users.filter(
      (u: any) => !submittedEmails.includes(u.fields["Email"])
    );

    // 4. Send reminders
    const results = [];

    for (const user of missingUsers) {
      const email = user.fields["Email"];
      const name = user.fields["Name"] || email;
      const projects = user.fields["Project CODEs"] || [];

      const emailResult = await sendReminderEmail(email, name, projects, lastFriday, appUrl);
      results.push({ email, name, projects, ...emailResult });
    }

    return NextResponse.json({
      success: true,
      weekChecked: lastFriday,
      totalUsers: users.length,
      reportsReceived: reports.length,
      missingCount: missingUsers.length,
      emailsSent: results.filter((r) => r.sent).length,
      details: results,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Error checking reports" }, { status: 500 });
  }
}
