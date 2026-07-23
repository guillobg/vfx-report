"use client";

import { UseFormReturn } from "react-hook-form";
import { FullReport } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";

interface StepReviewProps {
  form: UseFormReturn<FullReport>;
}

export function StepReview({ form }: StepReviewProps) {
  const { watch } = form;
  const data = watch();

  const currency = (data.metadata?.currency as "EUR" | "USD") || "EUR";

  const totalBudgeted =
    (data.finance?.episodes?.reduce((sum, ep) => sum + (ep.budgetedCost || 0), 0) || 0) +
    (data.finance?.assetsBudgeted || 0) +
    (data.finance?.overheadsBudgeted || 0);

  const totalEfc =
    (data.finance?.episodes?.reduce((sum, ep) => sum + (ep.efc || 0), 0) || 0) +
    (data.finance?.assetsEfc || 0) +
    (data.finance?.overheadsEfc || 0);

  const totalShots = data.shots?.episodes?.reduce(
    (sum, ep) =>
      sum + (ep.bidding || 0) + (ep.inProgress || 0) + (ep.finalDelivered || 0) + (ep.onHold || 0) + (ep.omitCtd || 0),
    0
  ) || 0;

  const totalFinal = data.shots?.episodes?.reduce(
    (sum, ep) => sum + (ep.finalDelivered || 0) + (ep.omitCtd || 0),
    0
  ) || 0;

  const percentComplete = totalShots > 0 ? ((totalFinal / totalShots) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Revisión Final</h2>
        <p className="mt-1 text-sm text-gray-600">Revisa todos los datos antes de enviar</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Proyecto</p>
          <p className="text-lg font-bold text-gray-900">{data.metadata?.projectCode || "—"}</p>
          <p className="text-xs text-gray-500">Semana: {data.metadata?.weekEnding || "—"}</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Presupuesto Total</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalBudgeted, currency)}</p>
          <p className={`text-xs ${totalBudgeted - totalEfc >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            Varianza: {formatCurrency(totalBudgeted - totalEfc, currency)}
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Total Shots</p>
          <p className="text-lg font-bold text-gray-900">{totalShots}</p>
          <p className="text-xs text-emerald-600">{percentComplete}% completado</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase">Assets</p>
          <p className="text-lg font-bold text-gray-900">{data.assets?.assets?.length || 0}</p>
        </div>
      </div>

      {/* Finance breakdown */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">💰 Desglose Financiero</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 pr-2">Episodio/Bobina</th>
                <th className="text-left py-1 pr-2">Cut Status</th>
                <th className="text-right py-1 pr-2">Presupuesto</th>
                <th className="text-right py-1 pr-2">EFC</th>
                <th className="text-right py-1">Varianza</th>
              </tr>
            </thead>
            <tbody>
              {data.finance?.episodes?.map((ep, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-1 pr-2">{ep.episodeReel}</td>
                  <td className="py-1 pr-2">{ep.cutStatus || "—"}</td>
                  <td className="py-1 pr-2 text-right">{formatCurrency(ep.budgetedCost || 0, currency)}</td>
                  <td className="py-1 pr-2 text-right">{formatCurrency(ep.efc || 0, currency)}</td>
                  <td className={`py-1 text-right ${(ep.budgetedCost || 0) - (ep.efc || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency((ep.budgetedCost || 0) - (ep.efc || 0), currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Narrative preview */}
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">📝 Informe Narrativo</h3>
        {[
          { label: "Progress & Key Developments", value: data.narrative?.progress },
          { label: "Finance Updates", value: data.narrative?.financeUpdates },
          { label: "Warnings", value: data.narrative?.warnings },
          { label: "Noteworthy", value: data.narrative?.noteworthy },
        ].map((section) => (
          <div key={section.label}>
            <p className="text-xs font-medium text-gray-500">{section.label}</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{section.value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Una vez enviado, los datos se guardarán en Airtable. Revisa cuidadosamente antes de enviar.
        </p>
      </div>
    </div>
  );
}
