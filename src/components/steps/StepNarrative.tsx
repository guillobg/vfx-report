"use client";

import { UseFormReturn } from "react-hook-form";
import { FullReport } from "@/lib/schemas";

interface StepNarrativeProps {
  form: UseFormReturn<FullReport>;
}

export function StepNarrative({ form }: StepNarrativeProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Informe Narrativo</h2>
        <p className="mt-1 text-sm text-gray-600">
          Secciones cualitativas del informe semanal
        </p>
      </div>

      <div className="space-y-5">
        {/* Progress */}
        <div>
          <label htmlFor="progress" className="block text-sm font-medium text-gray-700">
            Progreso y Desarrollos Clave
            <span className="text-xs text-gray-500 ml-1">(Progress & Key Developments)</span>
            <span className="text-red-500"> *</span>
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
