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
    (watch("finance.overheadsBudgeted") || 0) +
    (watch("finance.supervisionesBudgeted") || 0);

  const totalEfc =
    (episodes?.reduce((sum, ep) => sum + (ep.efc || 0), 0) || 0) +
    (watch("finance.assetsEfc") || 0) +
    (watch("finance.overheadsEfc") || 0) +
    (watch("finance.supervisionesEfc") || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Seguimiento Financiero
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Overall Gross Tracking Cost
        </p>
      </div>

      {/* VFX Shots Table */}
      <div className="border border-emerald-200 rounded-lg overflow-hidden">
        <div className="bg-emerald-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase">VFX Shots — por Episodio / Bobina</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-emerald-50 border-b border-emerald-200">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Ep.</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Cut Status</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">VFX Turnover</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">VFX Delivery</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Budgeted Cost</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">EFC</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Notes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="py-1 px-2">
                    <select
                      {...register(`finance.episodes.${index}.episodeReel`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    >
                      {["01","02","03","04","05","06","07","08"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <select
                      {...register(`finance.episodes.${index}.cutStatus`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    >
                      <option value="">—</option>
                      {CUT_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`finance.episodes.${index}.vfxTurnoverDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`finance.episodes.${index}.vfxDeliveryDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      {...register(`finance.episodes.${index}.budgetedCost`, { valueAsNumber: true })}
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border text-right"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      {...register(`finance.episodes.${index}.efc`, { valueAsNumber: true })}
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border text-right"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      {...register(`finance.episodes.${index}.notes`)}
                      placeholder=""
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-1">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-400 hover:text-red-600 p-0.5"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border-t px-4 py-2">
          <button
            type="button"
            onClick={() =>
              append({
                episodeReel: (fields.length + 1).toString().padStart(2, "0"),
                cutStatus: "",
                earlyTurnoverDate: "",
                vfxTurnoverDate: "",
                vfxDeliveryDate: "",
                budgetedCost: 0,
                efc: 0,
                notes: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-100 rounded hover:bg-emerald-200 transition-colors"
          >
            <Plus size={12} /> Añadir fila
          </button>
        </div>
      </div>

      {/* Additional costs by category */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase">Costes Adicionales</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-40">Categoría</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">Budgeted Cost ({currency})</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-700">EFC ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-blue-50">
                <td className="py-2 px-3 font-medium text-blue-800">Assets</td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.assetsBudgeted", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.assetsEfc", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
              </tr>
              <tr className="hover:bg-amber-50">
                <td className="py-2 px-3 font-medium text-amber-800">Overheads & Labour</td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.overheadsBudgeted", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.overheadsEfc", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
              </tr>
              <tr className="hover:bg-purple-50">
                <td className="py-2 px-3 font-medium text-purple-800">Supervisiones</td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.supervisionesBudgeted", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
                <td className="py-1 px-3">
                  <input
                    type="number"
                    {...register("finance.supervisionesEfc", { valueAsNumber: true })}
                    placeholder="0"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border text-right"
                  />
                </td>
              </tr>
            </tbody>
          </table>
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
