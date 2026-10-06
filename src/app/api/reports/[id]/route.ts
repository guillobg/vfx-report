import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

async function fetchRecordsByIds(tableId: string, ids: string[]) {
  if (!ids || ids.length === 0) return [];

  // Build OR(RECORD_ID()="id1", RECORD_ID()="id2", ...) formula
  const formula = `OR(${ids.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${tableId}?filterByFormula=${encodeURIComponent(formula)}`,
    { headers }
  );
  const data = await res.json();
  return (data.records || []).map((r: any) => r.fields);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the weekly report
    const reportRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tbldpQLs1Zh9vxTkr/${id}`,
      { headers }
    );
    if (!reportRes.ok) {
      return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
    }
    const report = await reportRes.json();
    const fields = report.fields;

    // Get linked record IDs
    const financeIds = fields["Finance Tracking"] || [];
    const shotIds = fields["Shot Tracking"] || [];
    const assetIds = fields["Asset Tracking"] || [];

    // Fetch linked records by IDs
    const [finance, shots, assets] = await Promise.all([
      fetchRecordsByIds("tblvQVK7E9dGzlzuR", financeIds),
      fetchRecordsByIds("tblXpf4PAjcuzZr1p", shotIds),
      fetchRecordsByIds("tblIurs3ds5SN2o7e", assetIds),
    ]);

    // Look up the project's LC Budget from Budget Tracking (one row per project).
    // The "Presupuesto" KPI reads the official LC Budget, not the per-report
    // budget figures entered in the finance table.
    // Note: a formula FIND on ARRAYJOIN({Project}) matches the project's primary
    // field (its name), not its record id — so we match the raw link array here.
    let lcBudget: number | null = null;
    const projectIds: string[] = fields["Project"] || [];
    if (projectIds.length > 0) {
      const projectId = projectIds[0];
      const btRes = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/tblhEDv5pRhIxMtMe?fields%5B%5D=${encodeURIComponent(
          "LC Budget"
        )}&fields%5B%5D=Project&maxRecords=200`,
        { headers }
      );
      if (btRes.ok) {
        const btData = await btRes.json();
        const match = (btData.records || []).find(
          (r: { fields: Record<string, unknown> }) =>
            Array.isArray(r.fields["Project"]) &&
            (r.fields["Project"] as string[]).includes(projectId)
        );
        const val = match?.fields?.["LC Budget"];
        if (typeof val === "number") lcBudget = val;
      }
    }

    return NextResponse.json({
      report: fields,
      finance,
      shots,
      assets,
      lcBudget,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Error al obtener el informe" }, { status: 500 });
  }
}
