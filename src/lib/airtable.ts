const AIRTABLE_TOKEN = process.env.AIRTABLE_API_TOKEN!;
const BASE_ID = process.env.AIRTABLE_BASE_ID!;

// Real table IDs from your base
const TABLES = {
  trackProjects: "tblEfY5scIch7ki07",
  weeklyReports: "tbldpQLs1Zh9vxTkr",
  financeTracking: "tblvQVK7E9dGzlzuR",
  shotTracking: "tblXpf4PAjcuzZr1p",
  assetTracking: "tblIurs3ds5SN2o7e",
  pmcDates: "tblGkS3S5obVTy6NV",
  keyDates: "tblTMJn9V1uUW09XS",
};

// Type values in PMC DATES that the report form owns (reads + writes).
// Everything else in PMC DATES (PP Start, Launch Date, Pre-GL, etc.) is
// managed manually in Airtable and MUST NOT be touched by the form.
const PMC_VFX_START = "VFX Start";
const PMC_VFX_DEADLINE = "VFX Deadline";

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
              ...(r.notes ? { Notes: r.notes } : {}),
            },
          };
        }),
      }),
    });
    await rateLimitDelay();
  }
}

// --- Project-level dates (PMC DATES + KEY DATES) ---

export interface ProjectVfxDate {
  episodeReel: string;
  vfxStartDate: string;
  vfxDeadlineDate: string;
  vfxStartRecordId: string;
  vfxDeadlineRecordId: string;
}

export interface ProjectKeyDate {
  recordId: string;
  category: string;
  description: string;
  date: string;
}

// Read the VFX Start / VFX Deadline rows the form owns, grouped by episode.
// Filtered by the project CODE text (ARRAYJOIN on a linked field renders the
// linked record's primary field, which is the project CODE — not its record id).
export async function getProjectVfxDates(
  projectCode: string
): Promise<ProjectVfxDate[]> {
  const safeCode = projectCode.replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `AND(OR({Type}='${PMC_VFX_START}',{Type}='${PMC_VFX_DEADLINE}'),FIND('${safeCode}',ARRAYJOIN({CODE}&''))>0)`
  );
  const res = await fetch(
    `${BASE_URL}/${TABLES.pmcDates}?filterByFormula=${formula}&maxRecords=200`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();
  if (data.error) {
    console.error("getProjectVfxDates error:", data.error);
    return [];
  }

  const byEpisode = new Map<string, ProjectVfxDate>();
  for (const r of data.records || []) {
    const f = r.fields as Record<string, unknown>;
    const ep = String(f["Episode / Reel"] || "").trim();
    if (!ep) continue; // skip rows without an episode (can't be matched safely)
    const type = f["Type"];
    const date = (f["Date"] as string) || "";
    if (!byEpisode.has(ep)) {
      byEpisode.set(ep, {
        episodeReel: ep,
        vfxStartDate: "",
        vfxDeadlineDate: "",
        vfxStartRecordId: "",
        vfxDeadlineRecordId: "",
      });
    }
    const row = byEpisode.get(ep)!;
    if (type === PMC_VFX_START) {
      row.vfxStartDate = date;
      row.vfxStartRecordId = r.id;
    } else if (type === PMC_VFX_DEADLINE) {
      row.vfxDeadlineDate = date;
      row.vfxDeadlineRecordId = r.id;
    }
  }
  return Array.from(byEpisode.values()).sort((a, b) =>
    a.episodeReel.localeCompare(b.episodeReel)
  );
}

// Read all Key Dates for the project (filtered by project CODE text).
export async function getProjectKeyDates(
  projectCode: string
): Promise<ProjectKeyDate[]> {
  const safeCode = projectCode.replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `FIND('${safeCode}',ARRAYJOIN({CODE}&''))>0`
  );
  const res = await fetch(
    `${BASE_URL}/${TABLES.keyDates}?filterByFormula=${formula}&maxRecords=200`,
    { headers, cache: "no-store" }
  );
  const data = await res.json();
  if (data.error) {
    console.error("getProjectKeyDates error:", data.error);
    return [];
  }
  return (data.records || []).map((r: { id: string; fields: Record<string, unknown> }) => ({
    recordId: r.id,
    category: (r.fields["Type"] as string) || "",
    description: (r.fields["Details"] as string) || "",
    date: (r.fields["Date"] as string) || "",
  }));
}

// Upsert VFX Start / VFX Deadline rows into PMC DATES.
// - Existing row (has recordId) with a date  -> PATCH
// - New row (no recordId) with a date        -> POST
// - Cleared date on an existing row          -> left untouched (Opción A: no borrar)
export async function upsertPmcVfxDates(
  projectRecordId: string,
  rows: Array<{
    episodeReel: string;
    vfxStartDate?: string;
    vfxDeadlineDate?: string;
    vfxStartRecordId?: string;
    vfxDeadlineRecordId?: string;
  }>
) {
  const toCreate: Array<{ fields: Record<string, unknown> }> = [];
  const toUpdate: Array<{ id: string; fields: Record<string, unknown> }> = [];

  const queue = (
    ep: string,
    type: string,
    date: string | undefined,
    recordId: string | undefined
  ) => {
    if (recordId) {
      // Only PATCH when there is a value; empty means "leave as-is" (no delete).
      if (date) {
        toUpdate.push({ id: recordId, fields: { Date: date } });
      }
    } else if (date) {
      toCreate.push({
        fields: {
          CODE: [projectRecordId],
          "Episode / Reel": ep,
          Type: type,
          Date: date,
          Details: `EP${ep} | ${type}`,
        },
      });
    }
  };

  for (const r of rows) {
    queue(r.episodeReel, PMC_VFX_START, r.vfxStartDate, r.vfxStartRecordId);
    queue(r.episodeReel, PMC_VFX_DEADLINE, r.vfxDeadlineDate, r.vfxDeadlineRecordId);
  }

  await batchWrite(TABLES.pmcDates, toCreate, toUpdate);
}

// Upsert Key Dates into KEY DATES table (Type is free text).
export async function upsertKeyDates(
  projectRecordId: string,
  rows: Array<{
    recordId?: string;
    category?: string;
    description?: string;
    date?: string;
  }>
) {
  const toCreate: Array<{ fields: Record<string, unknown> }> = [];
  const toUpdate: Array<{ id: string; fields: Record<string, unknown> }> = [];

  for (const r of rows) {
    const hasContent = r.category || r.description || r.date;
    if (!hasContent) continue; // skip fully empty rows
    const fields: Record<string, unknown> = {
      ...(r.category ? { Type: r.category } : {}),
      ...(r.description ? { Details: r.description } : {}),
      ...(r.date ? { Date: r.date } : {}),
    };
    if (r.recordId) {
      toUpdate.push({ id: r.recordId, fields });
    } else {
      toCreate.push({ fields: { CODE: [projectRecordId], ...fields } });
    }
  }

  await batchWrite(TABLES.keyDates, toCreate, toUpdate);
}

// Shared batched create/update helper (Airtable max 10 records/request).
async function batchWrite(
  tableId: string,
  toCreate: Array<{ fields: Record<string, unknown> }>,
  toUpdate: Array<{ id: string; fields: Record<string, unknown> }>
) {
  for (let i = 0; i < toCreate.length; i += 10) {
    const batch = toCreate.slice(i, i + 10);
    const res = await fetch(`${BASE_URL}/${tableId}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ records: batch }),
    });
    const result = await res.json();
    if (result.error) console.error(`batchWrite create error (${tableId}):`, result.error);
    await rateLimitDelay();
  }
  for (let i = 0; i < toUpdate.length; i += 10) {
    const batch = toUpdate.slice(i, i + 10);
    const res = await fetch(`${BASE_URL}/${tableId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ records: batch }),
    });
    const result = await res.json();
    if (result.error) console.error(`batchWrite update error (${tableId}):`, result.error);
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
