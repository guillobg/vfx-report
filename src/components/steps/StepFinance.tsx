"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport, CUT_STATUS_OPTIONS } from "@/lib/schemas";
import { Plus, Trash2 } from "lucide-react";

interface StepFinanceProps {
  form: UseFormReturn<FullReport>;
}

export function StepFinance({ form }: StepFinanceProps) {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "finance.episodes",
  });

  const currency = watch("metadata.currency") || "EUR";
  const episodes = watch("finance.episodes");

  // Calculate totals
  const totalBudgeted =
    (episodes?.reduce((sum, ep) => sum + (ep.budgetedCost || 0), 0) || 0) +
    (watch("finance.assetsBudgeted") || 0) +
    (watch("finance.overheadsBudgeted") || 0);

  const totalEfc =
    (episodes?.reduce((sum, ep) => sum + (ep.efc || 0), 0) || 0) +
    (watch("finance.assetsEfc") || 0) +
    (watch("finance.overheadsEfc") || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Seguimiento Financiero
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Overall Gross Tracking Cost — Coste global por episodio
        </p>
      </div>

      {/* Episode rows */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {episodes?.[index]?.episodeReel || `Episodio ${index + 1}`}
              </h3>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label="Eliminar episodio"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Episodio / Bobina
                </label>
                <input
                  {...register(`finance.episodes.${index}.episodeReel`)}
                  placeholder="EPISODE 01 / REEL 1"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Estado de Corte (Cut Status)
                </label>
                <select
                  {...register(`finance.episodes.${index}.cutStatus`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                >
                  <option value="">— Seleccionar —</option>
                  {CUT_STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  VFX Turnover Date
                </label>
                <input
                  type="date"
                  {...register(`finance.episodes.${index}.vfxTurnoverDate`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  VFX Delivery Date
                </label>
                <input
                  type="date"
                  {...register(`finance.episodes.${index}.vfxDeliveryDate`)}
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Coste Presupuestado ({currency})
                </label>
                <input
                  type="number"
                  {...register(`finance.episodes.${index}.budgetedCost`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600">
                  EFC ({currency})
                </label>
                <input
                  type="number"
                  {...register(`finance.episodes.${index}.efc`, {
                    valueAsNumber: true,
                  })}
                  placeholder="0"
                  className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-600">
                  Notas (Notes)
                </label>
                <input
                  {...register(`finance.episodes.${index}.notes`)}
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
            episodeReel: `EPISODE ${(fields.length + 1).toString().padStart(2, "0")}`,
            cutStatus: "",
            earlyTurnoverDate: "",
            vfxTurnoverDate: "",
            vfxDeliveryDate: "",
            budgetedCost: 0,
            efc: 0,
            notes: "",
          })
        }
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Plus size={16} /> Añadir Episodio
      </button>

      {/* Assets & Overheads */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Assets & Overheads
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Assets — Presupuesto ({currency})
            </label>
            <input
              type="number"
              {...register("finance.assetsBudgeted", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Assets — EFC ({currency})
            </label>
            <input
              type="number"
              {...register("finance.assetsEfc", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Overheads & Labour — Presupuesto ({currency})
            </label>
            <input
              type="number"
              {...register("finance.overheadsBudgeted", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Overheads & Labour — EFC ({currency})
            </label>
            <input
              type="number"
              {...register("finance.overheadsEfc", { valueAsNumber: true })}
              placeholder="0"
              className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-900 text-white rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400">Total Presupuesto</p>
            <p className="text-lg font-bold">
              {totalBudgeted.toLocaleString()} {currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total EFC</p>
            <p className="text-lg font-bold">
              {totalEfc.toLocaleString()} {currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Varianza</p>
            <p
              className={`text-lg font-bold ${
                totalBudgeted - totalEfc >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {(totalBudgeted - totalEfc).toLocaleString()} {currency}
            </p>
          </div>
        </div>
      </div>

      {errors.finance?.episodes && (
        <p className="text-sm text-red-600">
          {errors.finance.episodes.message ||
            errors.finance.episodes.root?.message}
        </p>
      )}
    </div>
  );
}
