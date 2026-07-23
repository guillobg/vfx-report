"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport, ASSET_STATUS_OPTIONS } from "@/lib/schemas";
import { Plus, Trash2 } from "lucide-react";

interface StepAssetsProps {
  form: UseFormReturn<FullReport>;
}

export function StepAssets({ form }: StepAssetsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets.assets",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Seguimiento de Assets
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Overall Asset Tracking Status — Estado de assets VFX
        </p>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-sm">
            No hay assets añadidos. Haz clic en &ldquo;Añadir Asset&rdquo; para comenzar.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Asset {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label="Eliminar asset"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-600">
                  Nombre del Asset (Asset Name)
                </label>
                <input
                  {...register(`assets.assets.${index}.assetName`)}
                  placeholder="CG DRAGON"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Episodio(s) (Episode(s))
                </label>
                <input
                  {...register(`assets.assets.${index}.episodes`)}
                  placeholder="101, 103"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Vendor(s)
                </label>
                <input
                  {...register(`assets.assets.${index}.vendors`)}
                  placeholder="Ranchito"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Estado (Status)
                </label>
                <select
                  {...register(`assets.assets.${index}.status`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                >
                  <option value="">— Seleccionar —</option>
                  {ASSET_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  % Completado (% Complete)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register(`assets.assets.${index}.percentComplete`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Fecha Inicio (Start Date)
                </label>
                <input
                  type="date"
                  {...register(`assets.assets.${index}.startDate`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Fecha Fin (End Date)
                </label>
                <input
                  type="date"
                  {...register(`assets.assets.${index}.endDate`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-gray-600">
                  Notas (Notes)
                </label>
                <input
                  {...register(`assets.assets.${index}.notes`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          append({
            assetName: "",
            episodes: "",
            vendors: "",
            status: "",
            percentComplete: 0,
            startDate: "",
            endDate: "",
            notes: "",
          })
        }
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Plus size={16} /> Añadir Asset
      </button>

      {errors.assets?.assets && (
        <p className="text-sm text-red-600">
          {typeof errors.assets.assets.message === "string"
            ? errors.assets.assets.message
            : "Revisa los datos de los assets"}
        </p>
      )}
    </div>
  );
}
