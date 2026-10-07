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

    // Find the most recent report for this project.
    // Note: a formula FIND on ARRAYJOIN(Project) matches the project's primary
    // field (its name), not its record id — so fetch recent reports and match
    // the raw Project link array by record id.
    const res = await fetch(
      `${BASE_URL}/${WEEKLY_REPORTS}?sort%5B0%5D%5Bfield%5D=Week+Ending&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=100`,
      { headers, cache: "no-store" }
    );
    const data = await res.json();

    const match = (data.records || []).find(
      (r: { fields: Record<string, any> }) =>
        Array.isArray(r.fields["Project"]) &&
        r.fields["Project"].includes(project.id)
    );

    if (!match) {
      // No previous report — nothing to copy
      return NextResponse.json({ hasPrevious: false });
    }

    const lastReport = match;
    const fields = lastReport.fields;

    const financeIds = fields["Finance Tracking"] || [];
    const shotIds = fields["Shot Tracking"] || [];
    const assetIds = fields["Asset Tracking"] || [];

    const [finance, shots, assets] = await Promise.all([
      fetchRecordsByIds(FINANCE, financeIds),
      fetchRecordsByIds(SHOTS, shotIds),
      fetchRecordsByIds(ASSETS, assetIds),
    ]);

    // Build payload with the last report's values AS-IS (the "Copy last data"
    // buttons overwrite each section with exactly what was reported before).
    const financeEpisodes = finance
      .filter((f: any) => /^\d{2}$/.test(f["Episode / Reel"] || "")) // only VFX Shots rows (episodes)
      .map((f: any) => ({
        episodeReel: f["Episode / Reel"] || "",
        cutStatus: f["Cut Status"] || "",
        budgetedCost: f["Budgeted Cost"] || 0,
        efc: f["EFC"] || 0,
        notes: f["Notes"] || "",
      }));

    const shotEpisodes = shots.map((s: any) => ({
      episodeReel: s["Episode / Reel"] || "",
      budgetedCount: 0,
      bidding: s["Total Shots"] || 0,
      queued: s["Queued Shots"] || 0,
      inProgress: s["In Progress"] || 0,
      finalDelivered: s["Final Delivered"] || 0,
      onHold: s["On Hold"] || 0,
      omitCtd: s["Omit CTD"] || 0,
      notes: s["Notes"] || "",
    }));

    const assetRows = assets.map((a: any) => ({
      assetName: a["Asset Name"] || "",
      episodes: a["Episode(s)"] || "",
      vendors: a["Vendor(s)"] || "",
      status: a["Status"] || "",
      percentComplete: Math.round(((a["% Complete"] || 0) as number) * 100),
      startDate: a["Start Date"] || "",
      endDate: a["End Date"] || "",
      notes: a["Notes"] || "",
    }));

    const findCat = (cat: string) =>
      finance.find((f: any) => f["Category"] === cat) || {};

    return NextResponse.json({
      hasPrevious: true,
      lastWeekEnding: fields["Week Ending"] || "",
      prefill: {
        financeEpisodes,
        shotEpisodes,
        assets: assetRows,
        assetsBudgeted: findCat("Assets")["Budgeted Cost"] || 0,
        assetsEfc: findCat("Assets")["EFC"] || 0,
        assetsNotes: findCat("Assets")["Notes"] || "",
        overheadsBudgeted: findCat("Overheads & Labour")["Budgeted Cost"] || 0,
        overheadsEfc: findCat("Overheads & Labour")["EFC"] || 0,
        overheadsNotes: findCat("Overheads & Labour")["Notes"] || "",
        supervisionesBudgeted: findCat("Supervisiones")["Budgeted Cost"] || 0,
        supervisionesEfc: findCat("Supervisiones")["EFC"] || 0,
        supervisionesNotes: findCat("Supervisiones")["Notes"] || "",
      },
    });
  } catch (error) {
    console.error("Error fetching last report:", error);
    return NextResponse.json({ error: "Error al obtener el informe anterior" }, { status: 500 });
  }
}
