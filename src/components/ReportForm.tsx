"use client";

import { useState, useEffect, ReactNode } from "react";
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
import { Send, Loader2, Eye, EyeOff } from "lucide-react";

/**
 * Section wrapper — mirrors the reference layout:
 * uppercase title + divider line on the left panel, and an optional
 * helper column on the right.
 */
function Section({
  title,
  subtitle,
  helpTitle,
  helpBody,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  helpTitle?: string;
  helpBody?: string;
  headerRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-gray-50 rounded-xl border border-gray-200 p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* Main panel */}
        <div>
          <div className="border-b border-gray-200 pb-3 mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-600 uppercase tracking-wide">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {headerRight && <div className="shrink-0 text-right">{headerRight}</div>}
          </div>
          {children}
        </div>

        {/* Helper column */}
        {helpTitle && (
          <aside className="hidden lg:block">
            <div className="border-l-2 border-amber-400 pl-4">
              <h3 className="text-base font-medium text-gray-700">{helpTitle}</h3>
              {helpBody && (
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {helpBody}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
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
        overheadsBudgeted: 0,
        overheadsEfc: 0,
        supervisionesBudgeted: 0,
        supervisionesEfc: 0,
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

  // Build a specific message naming which sections have validation errors,
  // so the user knows exactly where to look instead of a generic warning.
  const describeErrors = (): string => {
    const e = form.formState.errors;
    const sections: string[] = [];
    if (e.metadata) sections.push("Choose your Project");
    if (e.calendar) sections.push("Calendar and Key Dates");
    if (e.finance) sections.push("Financial Report");
    if (e.shots) sections.push("Shot Tracking");
    if (e.assets) sections.push("Shot Tracking (Assets)");
    if (e.narrative) sections.push("Weekly Narrative");
    if (sections.length === 0) {
      return "Por favor revisa los campos obligatorios marcados en rojo";
    }
    return `Revisa los campos marcados en rojo en: ${sections.join(", ")}`;
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
    <div className="max-w-6xl mx-auto space-y-6">
      {prefillLoading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-600" />
          <p className="text-sm text-blue-700">Cargando datos del informe anterior...</p>
        </div>
      )}

      {prefillInfo && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-800">
            💡 Datos precargados del informe anterior (semana{" "}
            <strong>{prefillInfo.lastWeekEnding}</strong>) y fechas del calendario del
            proyecto. Revisa y actualiza solo lo que haya cambiado esta semana.
          </p>
        </div>
      )}

      {/* 1. Choose your Project */}
      <Section
        title="Choose your Project"
        subtitle="Selecciona el proyecto del informe"
        helpTitle="¿Cómo empezar?"
        helpBody="Elige el proyecto: se cargarán automáticamente sus episodios/bobinas, las fechas del calendario y los datos del último informe para que solo actualices lo que cambió."
        headerRight={
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha del informe</p>
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
        subtitle="VFX Calendar y fechas clave del proyecto"
        helpTitle="Fechas a nivel de proyecto"
        helpBody="VFX Start / VFX Deadline se guardan por episodio en el calendario del proyecto. En Key Dates puedes anotar hitos como revisiones creativas o días de rodaje, con su categoría, descripción y fecha."
      >
        <SectionCalendar form={form} />
      </Section>

      {/* 3. Financial Report */}
      <Section
        title="Financial Report"
        subtitle="Overall Gross Tracking Cost"
        helpTitle="Presupuesto y EFC"
        helpBody="Introduce el coste presupuestado y el EFC por episodio, más las categorías de Assets, Overheads y Supervisiones. Los totales y la varianza se calculan automáticamente."
      >
        <StepFinance form={form} />
      </Section>

      {/* 4. Shot Tracking */}
      <Section
        title="Shot Tracking"
        subtitle="Overall Shot & Asset Tracking Status"
        helpTitle="Estado de shots y assets"
        helpBody="Registra el estado semanal de los shots por episodio y el seguimiento de assets. El porcentaje de avance se calcula a partir de los entregados y omitidos."
      >
        <StepShots form={form} />
      </Section>

      {/* 5. Narrativa */}
      <Section
        title="Weekly Narrative"
        subtitle="Secciones cualitativas del informe semanal"
        helpTitle="Contexto del informe"
        helpBody="Explica el progreso, las actualizaciones financieras, las advertencias y las notas destacables. Estas secciones acompañan a los datos numéricos en el informe final."
      >
        <StepNarrative form={form} />
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
              Previsualización del Informe
            </h2>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <EyeOff size={14} /> Ocultar
            </button>
          </div>
          <StepReview form={form} />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 pb-10">
        <button
          type="button"
          onClick={handleGeneratePreview}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye size={16} /> Generar previsualización
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
              <Send size={16} /> Enviar Informe
            </>
          )}
        </button>
      </div>
    </div>
  );
}
