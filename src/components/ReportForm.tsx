"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FullReport, fullReportSchema } from "@/lib/schemas";
import { getMostRecentFriday } from "@/lib/utils";
import { Project } from "@/lib/airtable";
import { StepMetadata } from "@/components/steps/StepMetadata";
import { SectionCalendar } from "@/components/steps/SectionCalendar";
import { StepFinance } from "@/components/steps/StepFinance";
import { StepShots } from "@/components/steps/StepShots";
import { StepNarrative } from "@/components/steps/StepNarrative";
import { StepReview } from "@/components/steps/StepReview";
import { Send, Loader2, Eye, EyeOff, Info, X } from "lucide-react";

/**
 * Click-to-open info popover shown next to a section title. Replaces the old
 * fixed helper column so the section can use the full width.
 */
function InfoPopover({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`More info: ${title}`}
        aria-expanded={open}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <Info size={18} />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-2 w-80 max-w-[80vw] rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-sm font-semibold text-slate-700 border-l-2 border-amber-400 pl-2">
              {title}
            </h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">{body}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Full-width section: uppercase title + divider, an optional info popover, and
 * optional right-aligned header content.
 */
function Section({
  title,
  subtitle,
  helpTitle,
  helpBody,
  headerRight,
  tone = "slate",
  children,
}: {
  title: string;
  subtitle?: string;
  helpTitle?: string;
  helpBody?: string;
  headerRight?: ReactNode;
  tone?: "slate" | "sky" | "emerald" | "amber" | "violet";
  children: ReactNode;
}) {
  // Soft, non-distracting section backgrounds + matching borders.
  const TONES: Record<string, string> = {
    slate: "bg-slate-50 border-slate-200",
    sky: "bg-sky-50/60 border-sky-100",
    emerald: "bg-emerald-50/60 border-emerald-100",
    amber: "bg-amber-50/60 border-amber-100",
    violet: "bg-violet-50/60 border-violet-100",
  };
  return (
    <section className={`${TONES[tone]} rounded-xl border p-6 sm:p-8`}>
      <div className="border-b border-gray-200 pb-4 mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 uppercase tracking-wide">
              {title}
            </h2>
            {helpTitle && helpBody && (
              <InfoPopover title={helpTitle} body={helpBody} />
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-base text-gray-500">{subtitle}</p>
          )}
        </div>
        {headerRight && <div className="shrink-0 text-right">{headerRight}</div>}
      </div>
      {children}
    </section>
  );
}

export function ReportForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillInfo, setPrefillInfo] = useState<{ lastWeekEnding: string; count: number } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FullReport>({
    resolver: zodResolver(fullReportSchema) as unknown as Resolver<FullReport>,
    defaultValues: {
      metadata: {
        projectCode: "",
        weekEnding: getMostRecentFriday(),
        currency: "EUR",
      },
      calendar: {
        vfxCalendar: [],
        keyDates: [{ category: "", description: "", date: "", recordId: "" }],
      },
      finance: {
        episodes: [],
        assetsBudgeted: 0,
        assetsEfc: 0,
        assetsNotes: "",
        overheadsBudgeted: 0,
        overheadsEfc: 0,
        overheadsNotes: "",
        supervisionesBudgeted: 0,
        supervisionesEfc: 0,
        supervisionesNotes: "",
      },
      shots: {
        episodes: [],
      },
      assets: { assets: [] },
      narrative: {
        progress: "",
        financeUpdates: "",
        warnings: "",
        noteworthy: "",
      },
    },
    mode: "onBlur",
  });

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    }
    fetchProjects();
  }, []);

  // When project is selected, pre-populate episodes/reels + calendar dates
  const selectedProjectCode = form.watch("metadata.projectCode");
  useEffect(() => {
    if (!selectedProjectCode) return;
    const project = projects.find((p) => p.code === selectedProjectCode);
    if (!project) return;

    // Avoid re-running if episodes are already populated
    const currentFinEps = form.getValues("finance.episodes");
    if (currentFinEps.length > 0) return;

    const isMovie = project.type === "Movies";
    const count = isMovie ? 5 : Math.min(project.numEpisodes || 4, 4);

    const episodeLabels = Array.from({ length: count }, (_, i) =>
      (i + 1).toString().padStart(2, "0")
    );

    function buildBlank() {
      form.setValue(
        "finance.episodes",
        episodeLabels.map((ep) => ({
          episodeReel: ep,
          cutStatus: "",
          budgetedCost: 0,
          efc: 0,
          notes: "",
        }))
      );
      form.setValue(
        "shots.episodes",
        episodeLabels.map((ep) => ({
          episodeReel: ep,
          budgetedCount: 0,
          bidding: 0,
          queued: 0,
          inProgress: 0,
          finalDelivered: 0,
          onHold: 0,
          omitCtd: 0,
          notes: "",
        }))
      );
      setPrefillInfo(null);
    }

    // Load calendar dates for the project (PMC VFX Start/Deadline + Key Dates)
    async function loadCalendar() {
      try {
        const res = await fetch(`/api/projects/${selectedProjectCode}/dates`);
        if (!res.ok) throw new Error("dates fetch failed");
        const data = await res.json();

        // VFX calendar: merge existing dates with the episode list so every
        // episode has a row, keeping record ids for upsert.
        const existing = new Map<string, {
          vfxStartDate: string;
          vfxDeadlineDate: string;
          vfxStartRecordId: string;
          vfxDeadlineRecordId: string;
        }>();
        for (const d of data.vfxCalendar || []) {
          existing.set(d.episodeReel, {
            vfxStartDate: d.vfxStartDate || "",
            vfxDeadlineDate: d.vfxDeadlineDate || "",
            vfxStartRecordId: d.vfxStartRecordId || "",
            vfxDeadlineRecordId: d.vfxDeadlineRecordId || "",
          });
        }
        const vfxRows = episodeLabels.map((ep) => ({
          episodeReel: ep,
          vfxStartDate: existing.get(ep)?.vfxStartDate || "",
          vfxDeadlineDate: existing.get(ep)?.vfxDeadlineDate || "",
          vfxStartRecordId: existing.get(ep)?.vfxStartRecordId || "",
          vfxDeadlineRecordId: existing.get(ep)?.vfxDeadlineRecordId || "",
        }));
        // Include any existing episodes outside the default range
        for (const [ep, v] of existing) {
          if (!episodeLabels.includes(ep)) {
            vfxRows.push({ episodeReel: ep, ...v });
          }
        }
        form.setValue("calendar.vfxCalendar", vfxRows);

        // Key dates: existing rows + one blank row to add more
        const keyRows = (data.keyDates || []).map(
          (k: { recordId: string; category: string; description: string; date: string }) => ({
            category: k.category || "",
            description: k.description || "",
            date: k.date || "",
            recordId: k.recordId || "",
          })
        );
        keyRows.push({ category: "", description: "", date: "", recordId: "" });
        form.setValue("calendar.keyDates", keyRows);
      } catch {
        // On failure, still give the user editable blank calendar rows
        form.setValue(
          "calendar.vfxCalendar",
          episodeLabels.map((ep) => ({
            episodeReel: ep,
            vfxStartDate: "",
            vfxDeadlineDate: "",
            vfxStartRecordId: "",
            vfxDeadlineRecordId: "",
          }))
        );
      }
    }

    // Try to prefill finance/shots from the last report
    async function loadPrefill() {
      setPrefillLoading(true);
      try {
        const res = await fetch(`/api/reports/last/${selectedProjectCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasPrevious && data.prefill) {
            const p = data.prefill;
            if (!p.financeEpisodes.length) {
              buildBlank();
            } else {
              form.setValue("finance.episodes", p.financeEpisodes);
              form.setValue("shots.episodes", p.shotEpisodes);
              form.setValue("assets.assets", p.assets || []);
              form.setValue("finance.assetsBudgeted", p.assetsBudgeted || 0);
              form.setValue("finance.overheadsBudgeted", p.overheadsBudgeted || 0);
              form.setValue("finance.supervisionesBudgeted", p.supervisionesBudgeted || 0);
              setPrefillInfo({ lastWeekEnding: data.lastWeekEnding, count });
            }
          } else {
            buildBlank();
          }
        } else {
          buildBlank();
        }
      } catch {
        buildBlank();
      } finally {
        setPrefillLoading(false);
      }
    }

    loadCalendar();
    loadPrefill();
  }, [selectedProjectCode, projects, form]);

  // Filter projects for coordinators
  const availableProjects =
    session?.user?.role === "admin"
      ? projects
      : projects.filter((p) => session?.user?.projects?.includes(p.code));

  // Official LC Budget of the selected project (from Airtable via /api/projects).
  // Null until a project with a defined LC Budget is selected.
  const selectedProject = projects.find((p) => p.code === selectedProjectCode);
  const lcBudget = selectedProject?.lcBudget ?? null;

  // Build a specific message naming which sections have validation errors,
  // so the user knows exactly where to look instead of a generic warning.
  const describeErrors = (): string => {
    const e = form.formState.errors;

    const SECTION_LABELS: Record<string, string> = {
      metadata: "Choose your Project",
      calendar: "Calendar and Key Dates",
      finance: "Financial Report",
      shots: "Shot Tracking",
      assets: "Assets",
      narrative: "Weekly Narrative",
    };

    // Walk the react-hook-form error tree and collect "path: message" leaves.
    const leaves: string[] = [];
    const walk = (node: unknown, path: string[]) => {
      if (!node || typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      if (typeof obj.message === "string" && obj.message) {
        const top = path[0];
        const label = SECTION_LABELS[top] || top;
        const rest = path.slice(1).join(" › ");
        leaves.push(rest ? `${label} (${rest}): ${obj.message}` : `${label}: ${obj.message}`);
        return;
      }
      for (const key of Object.keys(obj)) {
        if (key === "ref" || key === "type") continue;
        walk(obj[key], [...path, key]);
      }
    };
    walk(e, []);

    if (leaves.length === 0) {
      return "Please review the required fields marked in red";
    }
    // De-duplicate and cap the list length for readability
    const unique = Array.from(new Set(leaves));
    const shown = unique.slice(0, 6);
    const extra = unique.length - shown.length;
    return (
      "Missing or invalid fields: " +
      shown.join(" · ") +
      (extra > 0 ? ` · (+${extra} more)` : "")
    );
  };

  const handleGeneratePreview = async () => {
    const valid = await form.trigger();
    if (!valid) {
      setSubmitError(describeErrors());
      setShowPreview(false);
      return;
    }
    setSubmitError(null);
    setShowPreview(true);
    // Scroll to the preview panel after it renders
    setTimeout(() => {
      document.getElementById("report-preview")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleSubmit = async () => {
    const valid = await form.trigger();
    if (!valid) {
      setSubmitError(describeErrors());
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const values = form.getValues();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al enviar el informe");
      }

      const result = await res.json();
      router.push(`/dashboard?submitted=true&reportId=${result.reportId}`);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {prefillLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <p className="text-sm text-blue-700">Cargando datos del informe anterior...</p>
        </div>
      )}

      {prefillInfo && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800">
            💡 Data prefilled from the previous report (week{" "}
            <strong>{prefillInfo.lastWeekEnding}</strong>) y fechas del calendario del
            proyecto. Revisa y actualiza solo lo que haya cambiado esta semana.
          </p>
        </div>
      )}

      {/* 1. Choose your Project */}
      <Section
        title="Choose your Project"
        tone="sky"
        subtitle="Select the report's project"
        helpTitle="How to start?"
        helpBody="Pick the project: its episodes/reels, calendar dates and last report data load automatically so you only update what changed."
        headerRight={
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Report date</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        }
      >
        <StepMetadata form={form} projects={availableProjects} />
      </Section>

      {/* 2. Calendar and Key Dates */}
      <Section
        title="Calendar and Key Dates"
        tone="sky"
        subtitle="VFX Calendar y fechas clave del proyecto"
        helpTitle="Project-level dates"
        helpBody="VFX Start / VFX Deadline are saved per episode in the project calendar. In Key Dates you can note milestones such as creative reviews or shooting days, with their category, description and date."
      >
        <SectionCalendar form={form} />
      </Section>

      {/* 3. Financial Report */}
      <Section
        title="Financial Report"
        tone="sky"
        subtitle="Overall Gross Tracking Cost"
        helpTitle="Budget and EFC"
        helpBody="Enter the budgeted cost and EFC per episode, plus the Assets, Overheads and Supervisiones categories. Totals and variance are calculated automatically."
      >
        <StepFinance form={form} lcBudget={lcBudget} />
      </Section>

      {/* 4. Shot Tracking */}
      <Section
        title="Shot Tracking"
        tone="sky"
        subtitle="Overall Shot & Asset Tracking Status"
        helpTitle="Shots and assets status"
        helpBody="Registra el estado semanal de los shots por episodio y el seguimiento de assets. El porcentaje de avance se calcula a partir de los entregados y omitidos."
      >
        <StepShots form={form} />
      </Section>

      {/* 5. Narrativa */}
      <Section
        title="Weekly Narrative"
        tone="sky"
        subtitle="Secciones cualitativas del informe semanal"
        helpTitle="Contexto del informe"
        helpBody="Describe the progress, finance updates, warnings and noteworthy items. These sections accompany the numeric data in the final report."
      >
        <StepNarrative form={form} lcBudget={lcBudget} />
      </Section>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Preview panel */}
      {showPreview && (
        <div id="report-preview" className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">
              Report Preview
            </h2>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <EyeOff size={14} /> Ocultar
            </button>
          </div>
          <StepReview form={form} lcBudget={lcBudget} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 pb-10">
        <button
          type="button"
          onClick={handleGeneratePreview}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye size={16} /> Generate preview
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Enviando...
            </>
          ) : (
            <>
              <Send size={16} /> Submit Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}
