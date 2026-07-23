"use client";

import { UseFormReturn } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
import { CURRENCY_OPTIONS } from "@/lib/schemas";
import { Project } from "@/lib/airtable";

interface StepMetadataProps {
  form: UseFormReturn<FullReport>;
  projects: Project[];
}

export function StepMetadata({ form, projects }: StepMetadataProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Información del Informe
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Selecciona el proyecto y la semana del informe
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Project Selection */}
        <div className="sm:col-span-2">
          <label
            htmlFor="projectCode"
            className="block text-sm font-medium text-gray-700"
          >
            Proyecto <span className="text-xs text-gray-500">(Project CODE)</span>
          </label>
          <select
            id="projectCode"
            {...register("metadata.projectCode")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          >
            <option value="">— Selecciona un proyecto —</option>
            {projects.map((project) => (
              <option key={project.code} value={project.code}>
                {project.code} — {project.name} ({project.territory})
              </option>
            ))}
          </select>
          {errors.metadata?.projectCode && (
            <p className="mt-1 text-sm text-red-600">
              {errors.metadata.projectCode.message}
            </p>
          )}
        </div>

        {/* Week Ending */}
        <div>
          <label
            htmlFor="weekEnding"
            className="block text-sm font-medium text-gray-700"
          >
            Semana que termina{" "}
            <span className="text-xs text-gray-500">(Week Ending)</span>
          </label>
          <input
            type="date"
            id="weekEnding"
            {...register("metadata.weekEnding")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          />
          {errors.metadata?.weekEnding && (
            <p className="mt-1 text-sm text-red-600">
              {errors.metadata.weekEnding.message}
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <label
            htmlFor="currency"
            className="block text-sm font-medium text-gray-700"
          >
            Moneda <span className="text-xs text-gray-500">(Currency)</span>
          </label>
          <select
            id="currency"
            {...register("metadata.currency")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 border"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
