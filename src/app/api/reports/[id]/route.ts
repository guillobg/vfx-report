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

    return NextResponse.json({
      report: fields,
      finance,
      shots,
      assets,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Error al obtener el informe" }, { status: 500 });
  }
}
