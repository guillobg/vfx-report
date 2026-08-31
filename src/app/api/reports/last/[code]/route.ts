import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getProjectByCode } from "@/lib/airtable";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const WEEKLY_REPORTS = "tbldpQLs1Zh9vxTkr";
const FINANCE = "tblvQVK7E9dGzlzuR";
const SHOTS = "tblXpf4PAjcuzZr1p";
const ASSETS = "tblIurs3ds5SN2o7e";

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};
const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

async function fetchRecordsByIds(tableId: string, ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const formula = `OR(${ids.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
  const res = await fetch(
    `${BASE_URL}/${tableId}?filterByFormula=${encodeURIComponent(formula)}`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();
  return (data.records || []).map((r: any) => r.fields);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { code } = await params;

    const project = await getProjectByCode(code);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Find the most recent report for this project
    const formula = `FIND("${project.id}", ARRAYJOIN(Project))`;
    const res = await fetch(
      `${BASE_URL}/${WEEKLY_REPORTS}?filterByFormula=${encodeURIComponent(
        formula
      )}&sort%5B0%5D%5Bfield%5D=Week+Ending&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=1`,
      { headers, cache: "no-store" }
    );
    const data = await res.json();

    if (!data.records || data.records.length === 0) {
      // No previous report — nothing to prefill
      return NextResponse.json({ hasPrevious: false });
    }

    const lastReport = data.records[0];
    const fields = lastReport.fields;

    const financeIds = fields["Finance Tracking"] || [];
    const shotIds = fields["Shot Tracking"] || [];
    const assetIds = fields["Asset Tracking"] || [];

    const [finance, shots, assets] = await Promise.all([
      fetchRecordsByIds(FINANCE, financeIds),
      fetchRecordsByIds(SHOTS, shotIds),
      fetchRecordsByIds(ASSETS, assetIds),
    ]);

    // Build prefill payload — ONLY stable fields, blank the weekly ones
    const financeEpisodes = finance
      .filter((f: any) => /^\d{2}$/.test(f["Episode / Reel"] || "")) // only VFX Shots rows (episodes)
      .map((f: any) => ({
        episodeReel: f["Episode / Reel"] || "",
        cutStatus: f["Cut Status"] || "",
        vfxTurnoverDate: f["VFX Turnover Date"] || "",
        vfxDeliveryDate: f["VFX Delivery Date"] || "",
        budgetedCost: f["Budgeted Cost"] || 0,
        efc: 0, // weekly — blank
        earlyTurnoverDate: "",
        notes: "",
      }));

    const shotEpisodes = shots.map((s: any) => ({
      episodeReel: s["Episode / Reel"] || "",
      budgetedCount: 0,
      bidding: s["Total Shots"] || 0, // stable total
      inProgress: 0, // weekly — blank
      finalDelivered: 0, // weekly — blank
      onHold: 0, // weekly — blank
      omitCtd: 0, // weekly — blank
      notes: "",
    }));

    const assetRows = assets.map((a: any) => ({
      assetName: a["Asset Name"] || "",
      episodes: a["Episode(s)"] || "",
      vendors: a["Vendor(s)"] || "",
      status: "", // weekly — blank
      percentComplete: 0, // weekly — blank
      startDate: a["Start Date"] || "",
      endDate: a["End Date"] || "",
      notes: "",
    }));

    return NextResponse.json({
      hasPrevious: true,
      lastWeekEnding: fields["Week Ending"] || "",
      prefill: {
        financeEpisodes,
        shotEpisodes,
        assets: assetRows,
        // Carry over the additional cost categories' budgets (stable), blank EFC
        assetsBudgeted:
          finance.find((f: any) => f["Category"] === "Assets")?.["Budgeted Cost"] || 0,
        overheadsBudgeted:
          finance.find((f: any) => f["Category"] === "Overheads & Labour")?.[
            "Budgeted Cost"
          ] || 0,
        supervisionesBudgeted:
          finance.find((f: any) => f["Category"] === "Supervisiones")?.[
            "Budgeted Cost"
          ] || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching last report:", error);
    return NextResponse.json({ error: "Error al obtener el informe anterior" }, { status: 500 });
  }
}
