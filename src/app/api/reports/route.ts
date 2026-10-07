import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getProjectByCode,
  createWeeklyReport,
  createFinanceRecords,
  createShotRecords,
  createAssetRecords,
  upsertPmcVfxDates,
  upsertKeyDates,
  updateProjectEfc,
  upsertProjectShotSummary,
} from "@/lib/airtable";
import { fullReportSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();

    // Validate the full report
    const validation = fullReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check project access for coordinators
    if (
      session.user.role === "coordinator" &&
      !session.user.projects.includes(data.metadata.projectCode)
    ) {
      return NextResponse.json(
        { error: "No tienes acceso a este proyecto" },
        { status: 403 }
      );
    }

    // Get project record ID
    const project = await getProjectByCode(data.metadata.projectCode);
    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // 1. Create the weekly report
    const reportId = await createWeeklyReport({
      projectRecordId: project.id,
      projectCode: project.code,
      weekEnding: data.metadata.weekEnding,
      submittedBy: session.user.email,
      currency: data.metadata.currency,
      progress: data.narrative.progress || "",
      financeUpdates: data.narrative.financeUpdates || "",
      warnings: data.narrative.warnings || "",
      noteworthy: data.narrative.noteworthy || "",
    });

    // 2. Create finance records (filter out empty ones)
    const financeRecords = [
      ...data.finance.episodes
        .filter((ep) => ep.budgetedCost || ep.efc || ep.cutStatus)
        .map((ep) => ({
          episodeReel: ep.episodeReel || "",
          category: "VFX Shots",
          cutStatus: ep.cutStatus,
          budgetedCost: ep.budgetedCost,
          efc: ep.efc,
          notes: ep.notes,
        })),
      ...(data.finance.assetsBudgeted || data.finance.assetsEfc || data.finance.assetsNotes
        ? [{
            episodeReel: "",
            category: "Assets",
            budgetedCost: data.finance.assetsBudgeted,
            efc: data.finance.assetsEfc,
            notes: data.finance.assetsNotes,
          }]
        : []),
      ...(data.finance.overheadsBudgeted || data.finance.overheadsEfc || data.finance.overheadsNotes
        ? [{
            episodeReel: "",
            category: "Overheads & Labour",
            budgetedCost: data.finance.overheadsBudgeted,
            efc: data.finance.overheadsEfc,
            notes: data.finance.overheadsNotes,
          }]
        : []),
      ...(data.finance.supervisionesBudgeted || data.finance.supervisionesEfc || data.finance.supervisionesNotes
        ? [{
            episodeReel: "",
            category: "Supervisiones",
            budgetedCost: data.finance.supervisionesBudgeted,
            efc: data.finance.supervisionesEfc,
            notes: data.finance.supervisionesNotes,
          }]
        : []),
    ];
    if (financeRecords.length > 0) {
      await createFinanceRecords(reportId, financeRecords);
    }

    // 3. Create shot tracking records (filter out empty ones)
    const shotRecords = data.shots.episodes
      .filter((ep) => ep.bidding || ep.queued || ep.inProgress || ep.finalDelivered || ep.onHold || ep.omitCtd)
      .map((ep) => ({
        episodeReel: ep.episodeReel || "",
        budgetedCount: ep.budgetedCount,
        bidding: ep.bidding,
        queued: ep.queued,
        inProgress: ep.inProgress,
        finalDelivered: ep.finalDelivered,
        onHold: ep.onHold,
        omitCtd: ep.omitCtd,
        notes: ep.notes,
      }));
    if (shotRecords.length > 0) {
      await createShotRecords(reportId, shotRecords);
    }

    // 4. Create asset records (skip rows without a name — e.g. blank/placeholder rows)
    const assetRows = data.assets.assets.filter(
      (a) => a.assetName && a.assetName.trim()
    );
    if (assetRows.length > 0) {
      await createAssetRecords(
        reportId,
        assetRows.map((a) => ({
          assetName: (a.assetName || "").trim(),
          episodes: a.episodes || "",
          vendors: a.vendors || "",
          status: a.status,
          percentComplete: a.percentComplete,
          startDate: a.startDate,
          endDate: a.endDate,
          notes: a.notes,
        }))
      );
    }

    // 4b. Upsert project-level dates (PMC DATES + KEY DATES).
    // These are keyed to the PROJECT, not the weekly report, and only touch
    // rows the form owns (VFX Start / VFX Deadline). Manual PMC dates (PP Start,
    // Launch, etc.) are never read or modified here.
    if (data.calendar?.vfxCalendar?.length) {
      await upsertPmcVfxDates(project.id, data.calendar.vfxCalendar);
    }
    if (data.calendar?.keyDates?.length) {
      await upsertKeyDates(project.id, data.calendar.keyDates);
    }

    // 4c. Update the project's "EFC ProdCo Budget" in Budget Tracking with this
    // report's total EFC (episodes + Assets + Overheads + Supervisiones). The
    // latest report always wins, so Budget Tracking reflects the current EFC.
    const totalEfc =
      data.finance.episodes.reduce((s, ep) => s + (ep.efc || 0), 0) +
      (data.finance.assetsEfc || 0) +
      (data.finance.overheadsEfc || 0) +
      (data.finance.supervisionesEfc || 0);
    await updateProjectEfc(project.id, totalEfc);

    // 4d. Upsert the project's row in the "Shots Tracking" summary table with
    // the sum of this report's shot episodes (one row per project; latest wins).
    const shotTotals = data.shots.episodes.reduce(
      (acc, ep) => ({
        totalShots: acc.totalShots + (ep.bidding || 0),
        queued: acc.queued + (ep.queued || 0),
        inProgress: acc.inProgress + (ep.inProgress || 0),
        finalDelivered: acc.finalDelivered + (ep.finalDelivered || 0),
        onHold: acc.onHold + (ep.onHold || 0),
        omitCtd: acc.omitCtd + (ep.omitCtd || 0),
      }),
      { totalShots: 0, queued: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0 }
    );
    await upsertProjectShotSummary(project.id, shotTotals, data.metadata.weekEnding);

    // 5. Update the report with the view URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://main.dj7gpiydmt385.amplifyapp.com";
    const reportUrl = `${baseUrl}/report/${reportId}`;
    await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/tbldpQLs1Zh9vxTkr/${reportId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields: { "Report URL": reportUrl } }),
      }
    );

    return NextResponse.json({
      success: true,
      reportId,
      reportUrl,
      message: "Informe enviado correctamente",
    });
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: "Error al enviar el informe" },
      { status: 500 }
    );
  }
}
