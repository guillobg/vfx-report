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
      budgetedCount: acc.budgetedCount + (ep.budgetedCount || 0),
      bidding: acc.bidding + (ep.bidding || 0),
      inProgress: acc.inProgress + (ep.inProgress || 0),
      finalDelivered: acc.finalDelivered + (ep.finalDelivered || 0),
      onHold: acc.onHold + (ep.onHold || 0),
      omitCtd: acc.omitCtd + (ep.omitCtd || 0),
    }),
    {
      budgetedCount: 0,
      bidding: 0,
      inProgress: 0,
      finalDelivered: 0,
      onHold: 0,
      omitCtd: 0,
    }
  ) || { budgetedCount: 0, bidding: 0, inProgress: 0, finalDelivered: 0, onHold: 0, omitCtd: 0 };

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
          Overall Shot Tracking Status — Estado de shots por episodio
        </p>
      </div>

      {/* Episode rows */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const ep = episodes?.[index];
          const epTotal = ep?.bidding || 0;
          const epPercent =
            epTotal > 0
              ? (
                  (((ep?.finalDelivered || 0) + (ep?.omitCtd || 0)) / epTotal) *
                  100
                ).toFixed(1)
              : "0";

          return (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    {ep?.episodeReel || `Episodio ${index + 1}`}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Total: {epTotal} | {epPercent}% completado
                  </span>
                </div>
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

              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Episodio / Bobina
                  </label>
                  <input
                    {...register(`shots.episodes.${index}.episodeReel`)}
                    placeholder="EPISODE 01 / REEL 1"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Total Shots
                  </label>
                  <input
                    type="number"
                    {...register(`shots.episodes.${index}.bidding`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    In Progress
                  </label>
                  <input
                    type="number"
                    {...register(`shots.episodes.${index}.inProgress`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Final Delivered
                  </label>
                  <input
                    type="number"
                    {...register(`shots.episodes.${index}.finalDelivered`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    On Hold
                  </label>
                  <input
                    type="number"
                    {...register(`shots.episodes.${index}.onHold`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Omit CTD
                  </label>
                  <input
                    type="number"
                    {...register(`shots.episodes.${index}.omitCtd`, {
                      valueAsNumber: true,
                    })}
                    placeholder="0"
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    Notas
                  </label>
                  <input
                    {...register(`shots.episodes.${index}.notes`)}
                    className="mt-1 block w-full rounded border-gray-300 text-sm py-1.5 px-2 border"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() =>
          append({
            episodeReel: `EPISODE ${(fields.length + 1).toString().padStart(2, "0")}`,
            budgetedCount: 0,
            bidding: 0,
            inProgress: 0,
            finalDelivered: 0,
            onHold: 0,
            omitCtd: 0,
            notes: "",
          })
        }
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Plus size={16} /> Añadir Episodio
      </button>

      {/* Totals summary */}
      <div className="bg-gray-900 text-white rounded-lg p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400">Total Shots</p>
            <p className="text-lg font-bold">{totalCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-lg font-bold text-yellow-400">
              {totals.inProgress}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Final Delivered</p>
            <p className="text-lg font-bold text-emerald-400">
              {totals.finalDelivered}
            </p>
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
