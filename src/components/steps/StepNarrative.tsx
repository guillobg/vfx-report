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
      <div>
        <h2 className="text-xl font-bold text-gray-900">Informe Narrativo</h2>
        <p className="mt-1 text-sm text-gray-600">
          Secciones cualitativas del informe semanal
        </p>
      </div>

      {/* Data summary panel */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          📊 Resumen de datos introducidos
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Finance */}
          <div>
            <p className="text-xs text-gray-400">Presupuesto Total</p>
            <p className="text-sm font-bold">{formatCurrency(totalBudgeted, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">EFC Total</p>
            <p className="text-sm font-bold">{formatCurrency(totalEfc, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Varianza</p>
            <p className={`text-sm font-bold ${variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatCurrency(variance, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Estado</p>
            <p className={`text-sm font-bold ${variance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {variance >= 0 ? "Under budget" : "Over budget"}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {/* Shots */}
          <div>
            <p className="text-xs text-gray-400">Total Shots</p>
            <p className="text-sm font-bold">{totalShots}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-sm font-bold text-yellow-400">{totalInProgress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Delivered</p>
            <p className="text-sm font-bold text-emerald-400">{totalDelivered}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">On Hold</p>
            <p className="text-sm font-bold text-orange-400">{totalOnHold}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">% Completado</p>
            <p className="text-sm font-bold text-blue-400">{percentComplete}%</p>
          </div>
        </div>
      </div>

      {/* Narrative fields */}
      <div className="space-y-5">
        {/* Progress */}
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
            Progreso y Desarrollos Clave
            <span className="text-xs text-gray-500 ml-1">(Progress & Key Developments)</span>
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
            <span className="text-xs text-gray-500 ml-1">(Finance Updates)</span>
          </label>
          <textarea
            id="financeUpdates"
            rows={3}
            {...register("narrative.financeUpdates")}
            placeholder="Contexto sobre cambios de presupuesto, varianzas, aprobaciones..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
        </div>

        {/* Warnings */}
        <div>
          <label htmlFor="warnings" className="block text-sm font-medium text-gray-700">
            Advertencias
            <span className="text-xs text-gray-500 ml-1">(Warnings)</span>
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
        </div>

        {/* Noteworthy */}
        <div>
          <label htmlFor="noteworthy" className="block text-sm font-medium text-gray-700">
            Notas Destacables
            <span className="text-xs text-gray-500 ml-1">(Noteworthy)</span>
          </label>
          <textarea
            id="noteworthy"
            rows={2}
            {...register("narrative.noteworthy")}
            placeholder="Notas históricas relevantes para referencia futura..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
        </div>
      </div>
    </div>
  );
}
