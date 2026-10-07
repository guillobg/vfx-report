"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport, CUT_STATUS_OPTIONS } from "@/lib/schemas";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";

interface StepFinanceProps {
  form: UseFormReturn<FullReport>;
  lcBudget?: number | null;
}

export function StepFinance({ form, lcBudget }: StepFinanceProps) {
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

  // Sum of budget figures entered line by line (fallback when the project
  // has no official LC Budget yet).
  const lineBudgetSum =
    (episodes?.reduce((sum, ep) => sum + (ep.budgetedCost || 0), 0) || 0) +
    (watch("finance.assetsBudgeted") || 0) +
    (watch("finance.overheadsBudgeted") || 0) +
    (watch("finance.supervisionesBudgeted") || 0);

  // "Total Presupuesto" comes from the project's official LC Budget (Airtable).
  const totalBudgeted =
    typeof lcBudget === "number" ? lcBudget : lineBudgetSum;

  const totalEfc =
    (episodes?.reduce((sum, ep) => sum + (ep.efc || 0), 0) || 0) +
    (watch("finance.assetsEfc") || 0) +
    (watch("finance.overheadsEfc") || 0) +
    (watch("finance.supervisionesEfc") || 0);

  return (
    <div className="space-y-6">
      {/* VFX Shots Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-slate-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">VFX Shots — por Episodio / Bobina</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs table-fixed">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Ep.</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-28">Cut Status</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-28">Budgeted Cost</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-28">EFC</th>
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
                      className={`w-full rounded text-xs py-1 px-1 border ${
                        errors.finance?.episodes?.[index]?.episodeReel
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      }`}
                    >
                      <option value="">—</option>
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
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      <CurrencyInput
                        form={form}
                        name={`finance.episodes.${index}.budgetedCost`}
                        placeholder="0"
                        className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-1 border text-right"
                      />
                    </div>
                  </td>
                  <td className="py-1 px-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      <CurrencyInput
                        form={form}
                        name={`finance.episodes.${index}.efc`}
                        placeholder="0"
                        className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-1 border text-right"
                      />
                    </div>
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
                budgetedCost: 0,
                efc: 0,
                notes: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
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
          <table className="w-full text-xs table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-40">Categoría</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-32">Budgeted Cost</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-32">EFC</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-blue-50">
                <td className="py-2 px-3 font-medium text-blue-800">Assets</td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.assetsBudgeted"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.assetsEfc"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <input
                    {...register("finance.assetsNotes")}
                    placeholder="Notas…"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                  />
                </td>
              </tr>
              <tr className="hover:bg-amber-50">
                <td className="py-2 px-3 font-medium text-amber-800">Overheads & Labour</td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.overheadsBudgeted"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.overheadsEfc"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <input
                    {...register("finance.overheadsNotes")}
                    placeholder="Notas…"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                  />
                </td>
              </tr>
              <tr className="hover:bg-purple-50">
                <td className="py-2 px-3 font-medium text-purple-800">Supervisiones</td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.supervisionesBudgeted"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                    <CurrencyInput
                      form={form}
                      name="finance.supervisionesEfc"
                      placeholder="0"
                      className="w-full rounded border-gray-300 text-xs py-1 pl-5 pr-2 border text-right"
                    />
                  </div>
                </td>
                <td className="py-1 px-3">
                  <input
                    {...register("finance.supervisionesNotes")}
                    placeholder="Notas…"
                    className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-slate-200 border border-slate-300 text-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Total Presupuesto</p>
            <p className="text-lg font-bold text-slate-900">
              {totalBudgeted.toLocaleString()} {currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total EFC</p>
            <p className="text-lg font-bold text-slate-900">
              {totalEfc.toLocaleString()} {currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Varianza</p>
            <p
              className={`text-lg font-bold ${
                totalBudgeted - totalEfc >= 0 ? "text-emerald-600" : "text-red-500"
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
