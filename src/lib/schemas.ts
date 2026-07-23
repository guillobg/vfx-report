import { z } from "zod";

export const CUT_STATUS_OPTIONS = [
  "Shooting Script",
  "Assembly",
  "AC1",
  "AC2",
  "AC3",
  "Fine Cut",
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
  budgetedCost: z.number().min(0, "Debe ser positivo"),
  efc: z.number().min(0, "Debe ser positivo"),
  notes: z.string().optional(),
});

export const financeTrackingSchema = z.object({
  episodes: z.array(financeEpisodeSchema).min(1, "Añade al menos un episodio/bobina"),
  assetsBudgeted: z.number().min(0).default(0),
  assetsEfc: z.number().min(0).default(0),
  overheadsBudgeted: z.number().min(0).default(0),
  overheadsEfc: z.number().min(0).default(0),
});

// Step 3: Shot Tracking
export const shotEpisodeSchema = z.object({
  episodeReel: z.string().min(1, "Requerido"),
  budgetedCount: z.number().int().min(0),
  bidding: z.number().int().min(0),
  inProgress: z.number().int().min(0),
  finalDelivered: z.number().int().min(0),
  onHold: z.number().int().min(0),
  omitCtd: z.number().int().min(0),
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
  percentComplete: z.number().min(0).max(100).default(0),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

export const assetTrackingSchema = z.object({
  assets: z.array(assetSchema),
});

// Step 5: Narrative Sections
export const narrativeSchema = z.object({
  progress: z.string().min(1, "Este campo es obligatorio"),
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
