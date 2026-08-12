"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
import { Plus, Trash2 } from "lucide-react";

interface StepShotsProps {
  form: UseFormReturn<FullReport>;
}

export function StepShots({ form }: StepShotsProps) {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "shots.episodes",
  });

  const episodes = watch("shots.episodes");

  // Calculate totals
  const totals = episodes?.reduce(
    (acc, ep) => ({
      bidding: acc.bidding + (ep.bidding || 0),
      inProgress: acc.inProgress + (ep.inProgress || 0),
      finalDelivered: acc.finalDelivered + (ep.finalDelivered || 0),
      onHold: acc.onHold + (ep.onHold || 0),
      omitCtd: acc.omitCtd + (ep.omitCtd || 0),
    }),
    { bidding: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0 }
  ) || { bidding: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0 };

  const totalCount = totals.bidding;
  const percentComplete =
    totalCount > 0
      ? (((totals.finalDelivered + totals.omitCtd) / totalCount) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Seguimiento de Shots
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Overall Shot Tracking Status
        </p>
      </div>

      {/* Shot Tracking Table */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-blue-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase">Shot Tracking — por Episodio / Bobina</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-blue-50 border-b border-blue-200">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Ep.</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Total Shots</th>
                <th className="text-right py-2 px-2 font-semibold text-yellow-700">In Progress</th>
                <th className="text-right py-2 px-2 font-semibold text-emerald-700">Delivered</th>
                <th className="text-right py-2 px-2 font-semibold text-orange-700">On Hold</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-500">Omit CTD</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700">%</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Notes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fields.map((field, index) => {
                const ep = episodes?.[index];
                const epTotal = ep?.bidding || 0;
                const epPercent = epTotal > 0
                  ? (((ep?.finalDelivered || 0) + (ep?.omitCtd || 0)) / epTotal * 100).toFixed(1)
                  : "0";

                return (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="py-1 px-2">
                      <select
                        {...register(`shots.episodes.${index}.episodeReel`)}
                        className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                      >
                        {["01","02","03","04","05","06","07","08"].map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        {...register(`shots.episodes.${index}.bidding`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-gray-300 text-xs py-1 px-1 border text-right font-medium"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        {...register(`shots.episodes.${index}.inProgress`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-yellow-200 text-xs py-1 px-1 border text-right text-yellow-700 bg-yellow-50"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        {...register(`shots.episodes.${index}.finalDelivered`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-emerald-200 text-xs py-1 px-1 border text-right text-emerald-700 bg-emerald-50"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        {...register(`shots.episodes.${index}.onHold`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-orange-200 text-xs py-1 px-1 border text-right text-orange-700 bg-orange-50"
                      />
                    </td>
                    <td className="py-1 px-2">
                      <input
                        type="number"
                        {...register(`shots.episodes.${index}.omitCtd`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-gray-200 text-xs py-1 px-1 border text-right text-gray-500"
                      />
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span className="text-xs font-semibold text-gray-700">{epPercent}%</span>
                    </td>
                    <td className="py-1 px-2">
                      <input
                        {...register(`shots.episodes.${index}.notes`)}
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
                );
              })}
              {/* Totals row */}
              <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                <td className="py-2 px-2 text-xs">TOTAL</td>
                <td className="py-2 px-2 text-xs text-right">{totalCount}</td>
                <td className="py-2 px-2 text-xs text-right text-yellow-700">{totals.inProgress}</td>
                <td className="py-2 px-2 text-xs text-right text-emerald-700">{totals.finalDelivered}</td>
                <td className="py-2 px-2 text-xs text-right text-orange-700">{totals.onHold}</td>
                <td className="py-2 px-2 text-xs text-right text-gray-500">{totals.omitCtd}</td>
                <td className="py-2 px-2 text-xs text-center">{percentComplete}%</td>
                <td className="py-2 px-2"></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 border-t px-4 py-2">
          <button
            type="button"
            onClick={() =>
              append({
                episodeReel: (fields.length + 1).toString().padStart(2, "0"),
                budgetedCount: 0,
                bidding: 0,
                inProgress: 0,
                finalDelivered: 0,
                onHold: 0,
                omitCtd: 0,
                notes: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
          >
            <Plus size={12} /> Añadir fila
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-gray-900 text-white rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400">Total Shots</p>
            <p className="text-lg font-bold">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-lg font-bold text-yellow-400">{totals.inProgress}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Delivered</p>
            <p className="text-lg font-bold text-emerald-400">{totals.finalDelivered}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">On Hold</p>
            <p className="text-lg font-bold text-orange-400">{totals.onHold}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">% Completado</p>
            <p className="text-lg font-bold">{percentComplete}%</p>
          </div>
        </div>
      </div>

      {errors.shots?.episodes && (
        <p className="text-sm text-red-600">
          {errors.shots.episodes.message || errors.shots.episodes.root?.message}
        </p>
      )}
    </div>
  );
}
