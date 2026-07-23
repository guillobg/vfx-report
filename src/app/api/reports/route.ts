import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  getProjectByCode,
  createWeeklyReport,
  createFinanceRecords,
  createShotRecords,
  createAssetRecords,
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
        .filter((ep) => ep.budgetedCost || ep.efc || ep.cutStatus || ep.vfxTurnoverDate || ep.vfxDeliveryDate)
        .map((ep) => ({
          episodeReel: ep.episodeReel,
          cutStatus: ep.cutStatus,
          budgetedCost: ep.budgetedCost,
          efc: ep.efc,
          earlyTurnoverDate: ep.earlyTurnoverDate,
          vfxTurnoverDate: ep.vfxTurnoverDate,
          vfxDeliveryDate: ep.vfxDeliveryDate,
          notes: ep.notes,
        })),
      ...(data.finance.assetsBudgeted || data.finance.assetsEfc
        ? [{
            episodeReel: "ASSETS",
            budgetedCost: data.finance.assetsBudgeted,
            efc: data.finance.assetsEfc,
          }]
        : []),
      ...(data.finance.overheadsBudgeted || data.finance.overheadsEfc
        ? [{
            episodeReel: "OVERHEADS & LABOUR",
            budgetedCost: data.finance.overheadsBudgeted,
            efc: data.finance.overheadsEfc,
          }]
        : []),
    ];
    if (financeRecords.length > 0) {
      await createFinanceRecords(reportId, financeRecords);
    }

    // 3. Create shot tracking records (filter out empty ones)
    const shotRecords = data.shots.episodes
      .filter((ep) => ep.bidding || ep.inProgress || ep.finalDelivered || ep.onHold || ep.omitCtd)
      .map((ep) => ({
        episodeReel: ep.episodeReel,
        budgetedCount: ep.budgetedCount,
        bidding: ep.bidding,
        inProgress: ep.inProgress,
        finalDelivered: ep.finalDelivered,
        onHold: ep.onHold,
        omitCtd: ep.omitCtd,
        notes: ep.notes,
      }));
    if (shotRecords.length > 0) {
      await createShotRecords(reportId, shotRecords);
    }

    // 4. Create asset records
    if (data.assets.assets.length > 0) {
      await createAssetRecords(
        reportId,
        data.assets.assets.map((a) => ({
          assetName: a.assetName,
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

    // 5. Update the report with the view URL
    const baseUrl = process.env.NEXTAUTH_URL || "https://vfx-report.vercel.app";
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
