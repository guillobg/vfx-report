const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

// Real table IDs from your base
const TABLES = {
  trackProjects: "tblEfY5scIch7ki07",
  weeklyReports: "tbldpQLs1Zh9vxTkr",
  financeTracking: "tblvQVK7E9dGzlzuR",
  shotTracking: "tblXpf4PAjcuzZr1p",
  assetTracking: "tblIurs3ds5SN2o7e",
};

const headers = {
  Authorization: `Bearer ${AIRTABLE_TOKEN}`,
  "Content-Type": "application/json",
};

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;

// Rate limiter: max 5 requests/second
async function rateLimitDelay() {
  await new Promise((resolve) => setTimeout(resolve, 220));
}

// --- Types ---

export interface Project {
  id: string;
  code: string;
  name: string;
  territory: string;
  phase: string;
  type: string;
  numEpisodes: number;
  vfxVendors: string[];
  supervisor: string;
}

export interface WeeklyReport {
  id: string;
  code: string;
  project: string;
  weekEnding: string;
  submittedBy: string;
  currency: string;
  progress: string;
  financeUpdates: string;
  warnings: string;
  noteworthy: string;
}

// --- Fetch projects ---

export async function getActiveProjects(): Promise<Project[]> {
  const url = new URL(`${BASE_URL}/${TABLES.trackProjects}`);
  url.searchParams.set("view", "viwqzp8n6jSD1YD0I");
  url.searchParams.set(
    "filterByFormula",
    `AND({PHASE} != 'COMPLETE', {PHASE} != 'ARCHIVAL', {PHASE} != 'NEGOTIATING')`
  );
  url.searchParams.set(
    "fields[]",
    "CODE"
  );

  // Fetch with multiple fields
  const fieldsParams = ["CODE", "PROJECT", "Territory", "PHASE", "TYPE", "Num. Episode", "VENDORS IMPLICADOS", "VFX / Post Supervisor (ProdCo)"]
    .map((f) => `fields%5B%5D=${encodeURIComponent(f)}`)
    .join("&");

  const res = await fetch(
    `${BASE_URL}/${TABLES.trackProjects}?view=viwqzp8n6jSD1YD0I&filterByFormula=${encodeURIComponent("AND({PHASE} != 'COMPLETE', {PHASE} != 'ARCHIVAL', {PHASE} != 'NEGOTIATING')")}&${fieldsParams}`,
    { headers, next: { revalidate: 300 } }
  );

  const data = await res.json();

  return (data.records || []).map((r: any) => ({
    id: r.id,
    code: r.fields["CODE"] || "",
    name: r.fields["PROJECT"] || "",
    territory: r.fields["Territory"] || "",
    phase: r.fields["PHASE"] || "",
    type: r.fields["TYPE"] || "",
    numEpisodes: r.fields["Num. Episode"] || 0,
    vfxVendors: r.fields["VENDORS IMPLICADOS"] || [],
    supervisor: r.fields["VFX / Post Supervisor (ProdCo)"] || "",
  }));
}

export async function getProjectByCode(code: string): Promise<Project | null> {
  const formula = encodeURIComponent(`{CODE} = '${code}'`);
  const res = await fetch(
    `${BASE_URL}/${TABLES.trackProjects}?filterByFormula=${formula}&maxRecords=1`,
    { headers }
  );
  const data = await res.json();
  if (!data.records?.length) return null;

  const r = data.records[0];
  return {
    id: r.id,
    code: r.fields["CODE"] || "",
    name: r.fields["PROJECT"] || "",
    territory: r.fields["Territory"] || "",
    phase: r.fields["PHASE"] || "",
    type: r.fields["TYPE"] || "",
    numEpisodes: r.fields["Num. Episode"] || 0,
    vfxVendors: r.fields["VENDORS IMPLICADOS"] || [],
    supervisor: r.fields["VFX / Post Supervisor (ProdCo)"] || "",
  };
}

// --- Create weekly report ---

export async function createWeeklyReport(data: {
  projectRecordId: string;
  projectCode: string;
  weekEnding: string;
  submittedBy: string;
  currency: string;
  progress: string;
  financeUpdates: string;
  warnings: string;
  noteworthy: string;
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/${TABLES.weeklyReports}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: {
        "Report ID": `${data.projectCode}-${data.weekEnding}`,
        Project: [data.projectRecordId],
        "Week Ending": data.weekEnding,
        "Submitted By": data.submittedBy,
        Currency: data.currency,
        "Progress & Key Developments": data.progress,
        "Finance Updates": data.financeUpdates,
        Warnings: data.warnings,
        Noteworthy: data.noteworthy,
      },
    }),
  });

  const result = await res.json();
  if (result.error) throw new Error(result.error.message);
  return result.id;
}

// --- Create finance records (batch) ---

export async function createFinanceRecords(
  reportId: string,
  records: Array<{
    episodeReel: string;
    category?: string;
    cutStatus?: string;
    budgetedCost: number;
    efc: number;
    vfxTurnoverDate?: string;
    vfxDeliveryDate?: string;
    notes?: string;
  }>
) {
  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  for (const batch of batches) {
    await fetch(`${BASE_URL}/${TABLES.financeTracking}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        records: batch.map((r) => {
          const isEpisode = /^\d{2}$/.test(r.episodeReel);
          return {
            fields: {
              Report: [reportId],
              ...(isEpisode ? { "Episode / Reel": r.episodeReel } : {}),
              ...(r.category ? { Category: r.category } : {}),
              ...(r.cutStatus ? { "Cut Status": r.cutStatus } : {}),
              "Budgeted Cost": r.budgetedCost || 0,
              EFC: r.efc || 0,
              ...(r.vfxTurnoverDate ? { "VFX Turnover Date": r.vfxTurnoverDate } : {}),
              ...(r.vfxDeliveryDate ? { "VFX Delivery Date": r.vfxDeliveryDate } : {}),
              ...(r.notes ? { Notes: r.notes } : {}),
            },
          };
        }),
      }),
    });
    await rateLimitDelay();
  }
}

// --- Create shot records (batch) ---

export async function createShotRecords(
  reportId: string,
  records: Array<{
    episodeReel: string;
    budgetedCount: number;
    bidding: number;
    inProgress: number;
    finalDelivered: number;
    onHold: number;
    omitCtd: number;
    notes?: string;
  }>
) {
  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  for (const batch of batches) {
    const res = await fetch(`${BASE_URL}/${TABLES.shotTracking}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        records: batch.map((r) => ({
          fields: {
            Report: [reportId],
            "Episode / Reel": r.episodeReel,
            "Total Shots": r.bidding,
            "In Progress": r.inProgress,
            "Final Delivered": r.finalDelivered,
            "On Hold": r.onHold,
            "Omit CTD": r.omitCtd,
            ...(r.notes ? { Notes: r.notes } : {}),
          },
        })),
      }),
    });
    const result = await res.json();
    if (result.error) {
      console.error("Shot Tracking write error:", result.error);
    }
    await rateLimitDelay();
  }
}

// --- Create asset records (batch) ---

export async function createAssetRecords(
  reportId: string,
  records: Array<{
    assetName: string;
    episodes: string;
    vendors: string;
    status?: string;
    percentComplete: number;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }>
) {
  if (records.length === 0) return;

  const batches = [];
  for (let i = 0; i < records.length; i += 10) {
    batches.push(records.slice(i, i + 10));
  }

  for (const batch of batches) {
    await fetch(`${BASE_URL}/${TABLES.assetTracking}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        records: batch.map((r) => ({
          fields: {
            Report: [reportId],
            "Asset Name": r.assetName,
            "Episode(s)": r.episodes,
            "Vendor(s)": r.vendors,
            ...(r.status ? { Status: r.status } : {}),
            "% Complete": r.percentComplete / 100,
            ...(r.startDate ? { "Start Date": r.startDate } : {}),
            ...(r.endDate ? { "End Date": r.endDate } : {}),
            ...(r.notes ? { Notes: r.notes } : {}),
          },
        })),
      }),
    });
    await rateLimitDelay();
  }
}

// --- Get reports history ---

export async function getReportsForUser(submittedBy: string): Promise<WeeklyReport[]> {
  const formula = encodeURIComponent(`{Submitted By} = '${submittedBy}'`);
  const res = await fetch(
    `${BASE_URL}/${TABLES.weeklyReports}?filterByFormula=${formula}&sort%5B0%5D%5Bfield%5D=Week+Ending&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=50`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();

  return (data.records || []).map((r: any) => ({
    id: r.id,
    code: r.fields["CODE"]?.[0] || r.fields["Report ID"]?.split("-")[0] || "",
    project: "",
    weekEnding: r.fields["Week Ending"] || "",
    submittedBy: r.fields["Submitted By"] || "",
    currency: r.fields["Currency"] || "",
    progress: r.fields["Progress & Key Developments"] || "",
    financeUpdates: r.fields["Finance Updates"] || "",
    warnings: r.fields["Warnings"] || "",

    noteworthy: r.fields["Noteworthy"] || "",
  }));
}

export async function getAllReports(): Promise<WeeklyReport[]> {
  const res = await fetch(
    `${BASE_URL}/${TABLES.weeklyReports}?sort%5B0%5D%5Bfield%5D=Week+Ending&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=100`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();

  return (data.records || []).map((r: any) => ({
    id: r.id,
    code: r.fields["CODE"]?.[0] || r.fields["Report ID"]?.split("-")[0] || "",
    project: "",
    weekEnding: r.fields["Week Ending"] || "",
    submittedBy: r.fields["Submitted By"] || "",
    currency: r.fields["Currency"] || "",
    progress: r.fields["Progress & Key Developments"] || "",
    financeUpdates: r.fields["Finance Updates"] || "",
    warnings: r.fields["Warnings"] || "",

    noteworthy: r.fields["Noteworthy"] || "",
  }));
}
