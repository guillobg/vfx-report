"use client";

import { UseFormReturn } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
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
        <label
          htmlFor="projectCode"
          className="block text-base font-medium text-gray-700"
        >
          Proyecto <span className="text-sm text-gray-500">(Project CODE)</span>
        </label>
        <select
          id="projectCode"
          {...register("metadata.projectCode")}
          className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500 text-base py-2.5 px-3 border"
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
    </div>
  );
}
