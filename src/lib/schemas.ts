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
  projectCode: z.string().min(1, "Selecciona un proyecto"),
  weekEnding: z.string().min(1, "Fecha requerida"),
  currency: z.enum(CURRENCY_OPTIONS),
});

// Step 2: Finance Tracking
export const financeEpisodeSchema = z.object({
  episodeReel: z.string().min(1, "Requerido"),
  cutStatus: z.string().optional(),
  earlyTurnoverDate: z.string().optional(),
  vfxTurnoverDate: z.string().optional(),
  vfxDeliveryDate: z.string().optional(),
  budgetedCost: z.coerce.number().min(0).default(0),
  efc: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const financeTrackingSchema = z.object({
  episodes: z.array(financeEpisodeSchema).min(1, "Añade al menos un episodio/bobina"),
  assetsBudgeted: z.coerce.number().min(0).default(0),
  assetsEfc: z.coerce.number().min(0).default(0),
  overheadsBudgeted: z.coerce.number().min(0).default(0),
  overheadsEfc: z.coerce.number().min(0).default(0),
  supervisionesBudgeted: z.coerce.number().min(0).default(0),
  supervisionesEfc: z.coerce.number().min(0).default(0),
});

// Step 3: Shot Tracking
export const shotEpisodeSchema = z.object({
  episodeReel: z.string().min(1, "Requerido"),
  budgetedCount: z.coerce.number().int().min(0).default(0),
  bidding: z.coerce.number().int().min(0).default(0),
  inProgress: z.coerce.number().int().min(0).default(0),
  finalDelivered: z.coerce.number().int().min(0).default(0),
  onHold: z.coerce.number().int().min(0).default(0),
  omitCtd: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional(),
});

export const shotTrackingSchema = z.object({
  episodes: z.array(shotEpisodeSchema).min(1, "Añade al menos un episodio/bobina"),
});

// Step 4: Asset Tracking
export const assetSchema = z.object({
  assetName: z.string().min(1, "Nombre del asset requerido"),
  episodes: z.string().optional(),
  vendors: z.string().optional(),
  status: z.string().optional(),
  percentComplete: z.coerce.number().min(0).max(100).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const assetTrackingSchema = z.object({
  assets: z.array(assetSchema),
});

// Step 5: Narrative Sections
export const narrativeSchema = z.object({
  progress: z.string().optional(),
  financeUpdates: z.string().optional(),
  warnings: z.string().optional(),
  noteworthy: z.string().optional(),
});

// Full form schema
export const fullReportSchema = z.object({
  metadata: reportMetadataSchema,
  finance: financeTrackingSchema,
  shots: shotTrackingSchema,
  assets: assetTrackingSchema,
  narrative: narrativeSchema,
});

export type ReportMetadata = z.infer<typeof reportMetadataSchema>;
export type FinanceEpisode = z.infer<typeof financeEpisodeSchema>;
export type FinanceTracking = z.infer<typeof financeTrackingSchema>;
export type ShotEpisode = z.infer<typeof shotEpisodeSchema>;
export type ShotTracking = z.infer<typeof shotTrackingSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type AssetTracking = z.infer<typeof assetTrackingSchema>;
export type Narrative = z.infer<typeof narrativeSchema>;
export type FullReport = z.infer<typeof fullReportSchema>;
