"use client";

import { UseFormReturn } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";

interface StepNarrativeProps {
  form: UseFormReturn<FullReport>;
}

export function StepNarrative({ form }: StepNarrativeProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  // Watch data from previous steps for summary
  const currency = (watch("metadata.currency") as "EUR" | "USD") || "EUR";
  const financeEpisodes = watch("finance.episodes") || [];
  const assetsBudgeted = watch("finance.assetsBudgeted") || 0;
  const assetsEfc = watch("finance.assetsEfc") || 0;
  const overheadsBudgeted = watch("finance.overheadsBudgeted") || 0;
  const overheadsEfc = watch("finance.overheadsEfc") || 0;
  const shotEpisodes = watch("shots.episodes") || [];

  // Finance summary
  const totalBudgeted =
    financeEpisodes.reduce((sum, ep) => sum + (ep.budgetedCost || 0), 0) +
    assetsBudgeted + overheadsBudgeted;
  const totalEfc =
    financeEpisodes.reduce((sum, ep) => sum + (ep.efc || 0), 0) +
    assetsEfc + overheadsEfc;
  const variance = totalBudgeted - totalEfc;

  // Shots summary
  const totalShots = shotEpisodes.reduce((sum, ep) => sum + (ep.bidding || 0), 0);
  const totalInProgress = shotEpisodes.reduce((sum, ep) => sum + (ep.inProgress || 0), 0);
  const totalDelivered = shotEpisodes.reduce((sum, ep) => sum + (ep.finalDelivered || 0), 0);
  const totalOmit = shotEpisodes.reduce((sum, ep) => sum + (ep.omitCtd || 0), 0);
  const totalOnHold = shotEpisodes.reduce((sum, ep) => sum + (ep.onHold || 0), 0);
  const percentComplete = totalShots > 0
    ? (((totalDelivered + totalOmit) / totalShots) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Data summary panel */}
      <div className="bg-slate-200 border border-slate-300 text-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          📊 Resumen de datos introducidos
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Finance */}
          <div>
            <p className="text-xs text-slate-500">Presupuesto Total</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(totalBudgeted, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">EFC Total</p>
            <p className="text-sm font-bold text-slate-900">{formatCurrency(totalEfc, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Varianza</p>
            <p className={`text-sm font-bold ${variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {formatCurrency(variance, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Estado</p>
            <p className={`text-sm font-bold ${variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {variance >= 0 ? "Under budget" : "Over budget"}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-300 pt-3 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {/* Shots */}
          <div>
            <p className="text-xs text-slate-500">Total Shots</p>
            <p className="text-sm font-bold text-slate-900">{totalShots}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">In Progress</p>
            <p className="text-sm font-bold text-amber-600">{totalInProgress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Delivered</p>
            <p className="text-sm font-bold text-emerald-600">{totalDelivered}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">On Hold</p>
            <p className="text-sm font-bold text-orange-500">{totalOnHold}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">% Completado</p>
            <p className="text-sm font-bold text-sky-600">{percentComplete}%</p>
          </div>
        </div>
      </div>

      {/* Narrative fields */}
      <div className="space-y-5">
        {/* Progress */}
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
            Progreso y Desarrollos Clave
            <span className="text-xs text-gray-500 ml-1">(Progress & Key Developments)</span><span className="text-red-500"> *</span>
          </label>
          <textarea
            id="progress"
            rows={4}
            {...register("narrative.progress")}
            placeholder="¿Qué se ha logrado esta semana? Shots aprobados, entregas realizadas, hitos alcanzados..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
          {errors.narrative?.progress && (
            <p className="mt-1 text-sm text-red-600">{errors.narrative.progress.message}</p>
          )}
        </div>

        {/* Finance Updates */}
        <div>
          <label htmlFor="financeUpdates" className="block text-sm font-medium text-gray-700">
            Actualizaciones Financieras
            <span className="text-xs text-gray-500 ml-1">(Finance Updates)</span><span className="text-red-500"> *</span>
          </label>
          <textarea
            id="financeUpdates"
            rows={3}
            {...register("narrative.financeUpdates")}
            placeholder="Contexto sobre cambios de presupuesto, varianzas, aprobaciones..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
          {errors.narrative?.financeUpdates && (
            <p className="mt-1 text-sm text-red-600">{errors.narrative.financeUpdates.message}</p>
          )}
        </div>

        {/* Warnings */}
        <div>
          <label htmlFor="warnings" className="block text-sm font-medium text-gray-700">
            Advertencias
            <span className="text-xs text-gray-500 ml-1">(Warnings)</span><span className="text-red-500"> *</span>
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Usa 🔴 Crítico / 🟠 Alto / 🟡 Medio para indicar severidad
          </p>
          <textarea
            id="warnings"
            rows={3}
            {...register("narrative.warnings")}
            placeholder="🟠 Retraso en entrega de vendor X por cambios solicitados..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
          {errors.narrative?.warnings && (
            <p className="mt-1 text-sm text-red-600">{errors.narrative.warnings.message}</p>
          )}
        </div>

        {/* Noteworthy */}
        <div>
          <label htmlFor="noteworthy" className="block text-sm font-medium text-gray-700">
            Notas Destacables
            <span className="text-xs text-gray-500 ml-1">(Noteworthy)</span><span className="text-red-500"> *</span>
          </label>
          <textarea
            id="noteworthy"
            rows={2}
            {...register("narrative.noteworthy")}
            placeholder="Notas históricas relevantes para referencia futura..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
          {errors.narrative?.noteworthy && (
            <p className="mt-1 text-sm text-red-600">{errors.narrative.noteworthy.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
