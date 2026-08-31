"use client";

import { useState, useEffect } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FullReport, fullReportSchema } from "@/lib/schemas";
import { getMostRecentFriday } from "@/lib/utils";
import { Project } from "@/lib/airtable";
import { Stepper } from "@/components/Stepper";
import { StepMetadata } from "@/components/steps/StepMetadata";
import { StepFinance } from "@/components/steps/StepFinance";
import { StepShots } from "@/components/steps/StepShots";
import { StepNarrative } from "@/components/steps/StepNarrative";
import { StepReview } from "@/components/steps/StepReview";
import { ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react";

const STEPS = [
  "Proyecto",
  "Finanzas",
  "Shots & Assets",
  "Narrativa",
  "Revisión",
];

export function ReportForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillInfo, setPrefillInfo] = useState<{ lastWeekEnding: string; count: number } | null>(null);

  const form = useForm<FullReport>({
    resolver: zodResolver(fullReportSchema) as unknown as Resolver<FullReport>,
    defaultValues: {
      metadata: {
        projectCode: "",
        weekEnding: getMostRecentFriday(),
        currency: "EUR",
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

  // When project is selected, pre-populate episodes/reels
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

    function buildBlank() {
      const episodes = Array.from({ length: count }, (_, i) => ({
        episodeReel: (i + 1).toString().padStart(2, "0"),
        cutStatus: "",
        earlyTurnoverDate: "",
        vfxTurnoverDate: "",
        vfxDeliveryDate: "",
        budgetedCost: 0,
        efc: 0,
        notes: "",
      }));
      form.setValue("finance.episodes", episodes);
      const shotEps = Array.from({ length: count }, (_, i) => ({
        episodeReel: (i + 1).toString().padStart(2, "0"),
        budgetedCount: 0,
        bidding: 0,
        inProgress: 0,
        finalDelivered: 0,
        onHold: 0,
        omitCtd: 0,
        notes: "",
      }));
      form.setValue("shots.episodes", shotEps);
      setPrefillInfo(null);
    }

    // Try to prefill from the last report
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
              return;
            }
            form.setValue("finance.episodes", p.financeEpisodes);
            form.setValue("shots.episodes", p.shotEpisodes);
            form.setValue("assets.assets", p.assets || []);
            form.setValue("finance.assetsBudgeted", p.assetsBudgeted || 0);
            form.setValue("finance.overheadsBudgeted", p.overheadsBudgeted || 0);
            form.setValue("finance.supervisionesBudgeted", p.supervisionesBudgeted || 0);
            setPrefillInfo({ lastWeekEnding: data.lastWeekEnding, count });
            return;
          }
        }
        // No previous report — start blank
        buildBlank();
      } catch {
        buildBlank();
      } finally {
        setPrefillLoading(false);
      }
    }

    loadPrefill();
  }, [selectedProjectCode, projects, form]);

  // Reset to a blank report (discard prefill)
  const startBlank = () => {
    const project = projects.find((p) => p.code === selectedProjectCode);
    const isMovie = project?.type === "Movies";
    const count = isMovie ? 5 : Math.min(project?.numEpisodes || 4, 4);
    form.setValue(
      "finance.episodes",
      Array.from({ length: count }, (_, i) => ({
        episodeReel: (i + 1).toString().padStart(2, "0"),
        cutStatus: "",
        earlyTurnoverDate: "",
        vfxTurnoverDate: "",
        vfxDeliveryDate: "",
        budgetedCost: 0,
        efc: 0,
        notes: "",
      }))
    );
    form.setValue(
      "shots.episodes",
      Array.from({ length: count }, (_, i) => ({
        episodeReel: (i + 1).toString().padStart(2, "0"),
        budgetedCount: 0,
        bidding: 0,
        inProgress: 0,
        finalDelivered: 0,
        onHold: 0,
        omitCtd: 0,
        notes: "",
      }))
    );
    form.setValue("assets.assets", []);
    form.setValue("finance.assetsBudgeted", 0);
    form.setValue("finance.overheadsBudgeted", 0);
    form.setValue("finance.supervisionesBudgeted", 0);
    setPrefillInfo(null);
  };

  // Filter projects for coordinators
  const availableProjects =
    session?.user?.role === "admin"
      ? projects
      : projects.filter((p) => session?.user?.projects?.includes(p.code));

  const handleNext = async () => {
    // Basic validation before advancing
    let valid = true;
    if (currentStep === 0) {
      valid = await form.trigger("metadata");
    }
    if (valid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    // Validate full form
    const valid = await form.trigger();
    if (!valid) {
      setSubmitError("Por favor revisa los campos obligatorios marcados en rojo");
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StepMetadata form={form} projects={availableProjects} />;
      case 1:
        return <StepFinance form={form} />;
      case 2:
        return <StepShots form={form} />;
      case 3:
        return <StepNarrative form={form} />;
      case 4:
        return <StepReview form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper steps={STEPS} currentStep={currentStep} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {prefillLoading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-blue-600" />
            <p className="text-sm text-blue-700">Cargando datos del informe anterior...</p>
          </div>
        )}

        {prefillInfo && currentStep >= 1 && currentStep <= 2 && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-800">
              💡 Datos precargados del informe anterior (semana{" "}
              <strong>{prefillInfo.lastWeekEnding}</strong>). Fechas, cut status,
              total de shots y assets ya están rellenos — revisa y actualiza solo lo
              que haya cambiado esta semana.
            </p>
            <button
              type="button"
              onClick={startBlank}
              className="whitespace-nowrap text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
            >
              Empezar en blanco
            </button>
          </div>
        )}

        {renderStep()}

        {submitError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          )}
        </div>
      </div>
    </div>
  );
}
