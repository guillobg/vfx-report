import { NextRequest, NextResponse } from "next/server";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

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

    // Fetch linked finance records
    const financeFormula = encodeURIComponent(`FIND("${id}", ARRAYJOIN(Report))`);
    const financeRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tblvQVK7E9dGzlzuR?filterByFormula=${financeFormula}`,
      { headers }
    );
    const financeData = await financeRes.json();

    // Fetch linked shot records
    const shotFormula = encodeURIComponent(`FIND("${id}", ARRAYJOIN(Report))`);
    const shotRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tblXpf4PAjcuzZr1p?filterByFormula=${shotFormula}`,
      { headers }
    );
    const shotData = await shotRes.json();

    // Fetch linked asset records
    const assetFormula = encodeURIComponent(`FIND("${id}", ARRAYJOIN(Report))`);
    const assetRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/tblIurs3ds5SN2o7e?filterByFormula=${assetFormula}`,
      { headers }
    );
    const assetData = await assetRes.json();

    return NextResponse.json({
      report: report.fields,
      finance: (financeData.records || []).map((r: any) => r.fields),
      shots: (shotData.records || []).map((r: any) => r.fields),
      assets: (assetData.records || []).map((r: any) => r.fields),
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return NextResponse.json({ error: "Error al obtener el informe" }, { status: 500 });
  }
}
