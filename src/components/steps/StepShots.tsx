"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport, ASSET_STATUS_OPTIONS } from "@/lib/schemas";
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

  const { fields: shotFields, append: appendShot, remove: removeShot } = useFieldArray({
    control,
    name: "shots.episodes",
  });

  const { fields: assetFields, append: appendAsset, remove: removeAsset } = useFieldArray({
    control,
    name: "assets.assets",
  });

  const episodes = watch("shots.episodes");
  const assets = watch("assets.assets");

  // Shot totals
  const totals = episodes?.reduce(
    (acc, ep) => ({
      bidding: acc.bidding + (ep.bidding || 0),
      inProgress: acc.inProgress + (ep.inProgress || 0),
      finalDelivered: acc.finalDelivered + (ep.finalDelivered || 0),
      onHold: acc.onHold + (ep.onHold || 0),
      omitCtd: acc.omitCtd + (ep.omitCtd || 0),
      queued: acc.queued + (ep.queued || 0),
    }),
    { bidding: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0, queued: 0 }
  ) || { bidding: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0, queued: 0 };

  const totalCount = totals.bidding;
  const percentComplete =
    totalCount > 0
      ? (((totals.finalDelivered + totals.omitCtd) / totalCount) * 100).toFixed(1)
      : "0";

  // Asset average
  const assetAvg = assets?.length
    ? (assets.reduce((sum, a) => sum + (a.percentComplete || 0), 0) / assets.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* ==================== SHOT TRACKING TABLE ==================== */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-slate-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">Shot Tracking — por Episodio / Bobina</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-gray-700 w-16">Ep.</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">Total Shots</th>
                <th className="text-right py-2 px-2 font-semibold text-sky-700">Queued</th>
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
              {shotFields.map((field, index) => {
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
                        className={`w-full rounded text-xs py-1 px-1 border ${
                          errors.shots?.episodes?.[index]?.episodeReel
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
                        {...register(`shots.episodes.${index}.queued`, { valueAsNumber: true })}
                        placeholder="0"
                        className="w-full rounded border-sky-200 text-xs py-1 px-1 border text-right text-sky-700 bg-sky-50"
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
                        className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                      />
                    </td>
                    <td className="py-1 px-1">
                      {shotFields.length > 1 && (
                        <button type="button" onClick={() => removeShot(index)} className="text-red-400 hover:text-red-600 p-0.5" aria-label="Eliminar">
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
                <td className="py-2 px-2 text-xs text-right text-sky-700">{totals.queued}</td>
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
              appendShot({
                episodeReel: (shotFields.length + 1).toString().padStart(2, "0"),
                budgetedCount: 0,
                bidding: 0,
                queued: 0,
                inProgress: 0,
                finalDelivered: 0,
                onHold: 0,
                omitCtd: 0,
                notes: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <Plus size={12} /> Añadir fila
          </button>
        </div>
      </div>

      {/* ==================== ASSET TRACKING TABLE ==================== */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-slate-600 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">Asset Tracking</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Asset Name</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Ep.</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Vendor(s)</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                <th className="text-right py-2 px-2 font-semibold text-gray-700">%</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Start</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">End</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">Notes</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assetFields.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-400 text-xs">
                    No hay assets. Haz clic en &ldquo;Añadir fila&rdquo; para comenzar.
                  </td>
                </tr>
              )}
              {assetFields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="py-1 px-2">
                    <input
                      {...register(`assets.assets.${index}.assetName`)}
                      placeholder="CG Dragon"
                      className={`w-full rounded text-xs py-1 px-1 border ${
                        errors.assets?.assets?.[index]?.assetName
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.assets?.assets?.[index]?.assetName && (
                      <p className="mt-0.5 text-[10px] text-red-600">
                        {errors.assets.assets[index]?.assetName?.message}
                      </p>
                    )}
                  </td>
                  <td className="py-1 px-2">
                    <input
                      {...register(`assets.assets.${index}.episodes`)}
                      placeholder="01, 03"
                      className="w-16 rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      {...register(`assets.assets.${index}.vendors`)}
                      placeholder="Vendor"
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <select
                      {...register(`assets.assets.${index}.status`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    >
                      <option value="">—</option>
                      {ASSET_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register(`assets.assets.${index}.percentComplete`, { valueAsNumber: true })}
                      placeholder="0"
                      className="w-14 rounded border-gray-300 text-xs py-1 px-1 border text-right"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`assets.assets.${index}.startDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`assets.assets.${index}.endDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      {...register(`assets.assets.${index}.notes`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <button type="button" onClick={() => removeAsset(index)} className="text-red-400 hover:text-red-600 p-0.5" aria-label="Eliminar">
                      <Trash2 size={12} />
                    </button>
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
              appendAsset({
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
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <Plus size={12} /> Añadir fila
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-slate-200 border border-slate-300 text-slate-800 rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500">Total Shots</p>
            <p className="text-lg font-bold text-slate-900">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Queued</p>
            <p className="text-lg font-bold text-sky-600">{totals.queued}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">In Progress</p>
            <p className="text-lg font-bold text-amber-600">{totals.inProgress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Delivered</p>
            <p className="text-lg font-bold text-emerald-600">{totals.finalDelivered}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Shots %</p>
            <p className="text-lg font-bold text-slate-900">{percentComplete}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Assets</p>
            <p className="text-lg font-bold text-slate-700">{assets?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Assets %</p>
            <p className="text-lg font-bold text-slate-700">{assetAvg}%</p>
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
