"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
import { Plus, Trash2 } from "lucide-react";

interface SectionCalendarProps {
  form: UseFormReturn<FullReport>;
}

const EPISODE_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08"];

// Whole weeks from today until the VFX Deadline. Null if the deadline is
// missing or invalid. Negative if the deadline has already passed.
function weeksToDeliver(deadline?: string): number | null {
  if (!deadline) return null;
  const d = new Date(deadline).getTime();
  if (Number.isNaN(d)) return null;
  const now = Date.now();
  return Math.round((d - now) / (1000 * 60 * 60 * 24 * 7));
}

export function SectionCalendar({ form }: SectionCalendarProps) {
  const { register, control, watch } = form;

  const {
    fields: vfxFields,
    append: appendVfx,
    remove: removeVfx,
  } = useFieldArray({ control, name: "calendar.vfxCalendar" });

  const {
    fields: keyFields,
    append: appendKey,
    remove: removeKey,
  } = useFieldArray({ control, name: "calendar.keyDates" });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* ==================== VFX CALENDAR ==================== */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-slate-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">
            VFX Calendar
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-16">Ep</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">VFX Start</th>
                <th className="text-left py-2 px-2 font-semibold text-gray-700">VFX Deadline</th>
                <th className="text-center py-2 px-2 font-semibold text-gray-700 w-20">Weeks to Deliver</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vfxFields.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400 text-xs">
                    Selecciona un proyecto para cargar los episodios, o añade una fila.
                  </td>
                </tr>
              )}
              {vfxFields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="py-1 px-3">
                    <select
                      {...register(`calendar.vfxCalendar.${index}.episodeReel`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    >
                      {EPISODE_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`calendar.vfxCalendar.${index}.vfxStartDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="date"
                      {...register(`calendar.vfxCalendar.${index}.vfxDeadlineDate`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-1 border"
                    />
                  </td>
                  <td className="py-1 px-2 text-center text-gray-700 font-medium">
                    {(() => {
                      const w = weeksToDeliver(
                        watch(`calendar.vfxCalendar.${index}.vfxDeadlineDate`)
                      );
                      return w === null ? "—" : w;
                    })()}
                  </td>
                  <td className="py-1 px-1">
                    <button
                      type="button"
                      onClick={() => removeVfx(index)}
                      className="text-red-400 hover:text-red-600 p-0.5"
                      aria-label="Quitar fila"
                    >
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
              appendVfx({
                episodeReel: (vfxFields.length + 1).toString().padStart(2, "0"),
                vfxStartDate: "",
                vfxDeadlineDate: "",
                vfxStartRecordId: "",
                vfxDeadlineRecordId: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <Plus size={12} /> Añadir episodio
          </button>
        </div>
      </div>

      {/* ==================== KEY DATES ==================== */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-slate-700 px-4 py-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wide">
            Key Dates
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-56">Categoría</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">Descripción</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700 w-40">Fecha</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keyFields.map((field, index) => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="py-1 px-3">
                    <input
                      {...register(`calendar.keyDates.${index}.category`)}
                      placeholder="ej. Revisión creativa, Shooting Car Plates…"
                      className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                    />
                  </td>
                  <td className="py-1 px-3">
                    <input
                      {...register(`calendar.keyDates.${index}.description`)}
                      placeholder="Detalle de la fecha clave"
                      className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                    />
                  </td>
                  <td className="py-1 px-3">
                    <input
                      type="date"
                      {...register(`calendar.keyDates.${index}.date`)}
                      className="w-full rounded border-gray-300 text-xs py-1 px-2 border"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <button
                      type="button"
                      onClick={() => removeKey(index)}
                      className="text-red-400 hover:text-red-600 p-0.5"
                      aria-label="Quitar fila"
                    >
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
              appendKey({
                category: "",
                description: "",
                date: "",
                recordId: "",
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <Plus size={12} /> Añadir fecha
          </button>
        </div>
      </div>
    </div>
  );
}
