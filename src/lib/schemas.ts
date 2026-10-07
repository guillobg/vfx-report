import { z } from "zod";

export const CUT_STATUS_OPTIONS = [
  "AC1",
  "AC2",
  "AC3",
  "Picture Lock",
] as const;

export const ASSET_STATUS_OPTIONS = [
  "Not Started",
  "In Progress",
  "Final",
  "Omit",
  "On Hold",
] as const;

export const CURRENCY_OPTIONS = ["EUR", "USD"] as const;

// Step 1: Report Metadata
export const reportMetadataSchema = z.object({
  projectCode: z.string().min(1, "Select a project"),
  weekEnding: z.string().min(1, "Date required"),
  currency: z.enum(CURRENCY_OPTIONS),
});

// Calendar and Key Dates
// VFX Calendar row -> maps to PMC DATES table (Type = "VFX Start" / "VFX Deadline")
export const vfxCalendarRowSchema = z.object({
  episodeReel: z.string().optional(),
  vfxStartDate: z.string().optional(),
  vfxDeadlineDate: z.string().optional(),
  // Airtable record ids for upsert (empty = new). Not user-editable.
  vfxStartRecordId: z.string().optional(),
  vfxDeadlineRecordId: z.string().optional(),
});

// Key Date row -> maps to KEY DATES table (Type is free text)
export const keyDateRowSchema = z.object({
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  // Airtable record id for upsert (empty = new). Not user-editable.
  recordId: z.string().optional(),
});

export const calendarSchema = z.object({
  vfxCalendar: z.array(vfxCalendarRowSchema),
  keyDates: z.array(keyDateRowSchema),
});

// Step 2: Finance Tracking
export const financeEpisodeSchema = z.object({
  episodeReel: z.string().optional(),
  cutStatus: z.string().optional(),
  budgetedCost: z.coerce.number().min(0).default(0),
  efc: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

// A finance row has content if any meaningful field is filled.
function financeRowHasContent(r: z.infer<typeof financeEpisodeSchema>): boolean {
  return Boolean(
    (r.cutStatus && r.cutStatus.trim()) ||
      (r.budgetedCost && r.budgetedCost > 0) ||
      (r.efc && r.efc > 0) ||
      (r.notes && r.notes.trim())
  );
}

export const financeTrackingSchema = z
  .object({
    episodes: z.array(financeEpisodeSchema),
    assetsBudgeted: z.coerce.number().min(0).default(0),
    assetsEfc: z.coerce.number().min(0).default(0),
    assetsNotes: z.string().optional(),
    overheadsBudgeted: z.coerce.number().min(0).default(0),
    overheadsEfc: z.coerce.number().min(0).default(0),
    overheadsNotes: z.string().optional(),
    supervisionesBudgeted: z.coerce.number().min(0).default(0),
    supervisionesEfc: z.coerce.number().min(0).default(0),
    supervisionesNotes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    let contentRows = 0;
    data.episodes.forEach((row, i) => {
      const hasContent = financeRowHasContent(row);
      if (hasContent) {
        contentRows += 1;
        if (!(row.episodeReel && row.episodeReel.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["episodes", i, "episodeReel"],
            message: "Select the episode/reel",
          });
        }
      }
    });
    if (contentRows === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["episodes"],
        message: "Add at least one episode/reel with data",
      });
    }
  });

// Step 3: Shot Tracking
export const shotEpisodeSchema = z.object({
  episodeReel: z.string().optional(),
  budgetedCount: z.coerce.number().int().min(0).default(0),
  bidding: z.coerce.number().int().min(0).default(0),
  queued: z.coerce.number().int().min(0).default(0),
  inProgress: z.coerce.number().int().min(0).default(0),
  finalDelivered: z.coerce.number().int().min(0).default(0),
  onHold: z.coerce.number().int().min(0).default(0),
  omitCtd: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

// A shot row has content if any count is > 0 or notes filled.
function shotRowHasContent(r: z.infer<typeof shotEpisodeSchema>): boolean {
  return Boolean(
    (r.budgetedCount && r.budgetedCount > 0) ||
      (r.bidding && r.bidding > 0) ||
      (r.queued && r.queued > 0) ||
      (r.inProgress && r.inProgress > 0) ||
      (r.finalDelivered && r.finalDelivered > 0) ||
      (r.onHold && r.onHold > 0) ||
      (r.omitCtd && r.omitCtd > 0) ||
      (r.notes && r.notes.trim())
  );
}

export const shotTrackingSchema = z
  .object({
    episodes: z.array(shotEpisodeSchema),
  })
  .superRefine((data, ctx) => {
    let contentRows = 0;
    data.episodes.forEach((row, i) => {
      if (shotRowHasContent(row)) {
        contentRows += 1;
        if (!(row.episodeReel && row.episodeReel.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["episodes", i, "episodeReel"],
            message: "Select the episode/reel",
          });
        }
      }
    });
    if (contentRows === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["episodes"],
        message: "Add at least one episode/reel with data",
      });
    }
  });

// Step 4: Asset Tracking
export const assetSchema = z
  .object({
    assetName: z.string().optional(),
    episodes: z.string().optional(),
    vendors: z.string().optional(),
    status: z.string().optional(),
    percentComplete: z.coerce.number().min(0).max(100).default(0),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((row, ctx) => {
    // A completely empty asset row is ignored (it won't be sent to Airtable).
    // Only require a name when the user has entered other content on the row.
    const hasOtherContent = Boolean(
      (row.episodes && row.episodes.trim()) ||
        (row.vendors && row.vendors.trim()) ||
        (row.status && row.status.trim()) ||
        (row.percentComplete && row.percentComplete > 0) ||
        (row.startDate && row.startDate.trim()) ||
        (row.endDate && row.endDate.trim()) ||
        (row.notes && row.notes.trim())
    );
    if (hasOtherContent && !(row.assetName && row.assetName.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assetName"],
        message: "Asset name required",
      });
    }
  });

export const assetTrackingSchema = z.object({
  assets: z.array(assetSchema),
});

// Step 5: Narrative Sections
export const narrativeSchema = z.object({
  progress: z.string().min(1, "This field is required"),
  financeUpdates: z.string().min(1, "This field is required"),
  warnings: z.string().min(1, "This field is required"),
  noteworthy: z.string().min(1, "This field is required"),
});

// Full form schema
export const fullReportSchema = z.object({
  metadata: reportMetadataSchema,
  calendar: calendarSchema,
  finance: financeTrackingSchema,
  shots: shotTrackingSchema,
  assets: assetTrackingSchema,
  narrative: narrativeSchema,
});

export type ReportMetadata = z.infer<typeof reportMetadataSchema>;
export type VfxCalendarRow = z.infer<typeof vfxCalendarRowSchema>;
export type KeyDateRow = z.infer<typeof keyDateRowSchema>;
export type Calendar = z.infer<typeof calendarSchema>;
export type FinanceEpisode = z.infer<typeof financeEpisodeSchema>;
export type FinanceTracking = z.infer<typeof financeTrackingSchema>;
export type ShotEpisode = z.infer<typeof shotEpisodeSchema>;
export type ShotTracking = z.infer<typeof shotTrackingSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetTracking = z.infer<typeof assetTrackingSchema>;
export type Narrative = z.infer<typeof narrativeSchema>;
export type FullReport = z.infer<typeof fullReportSchema>;
