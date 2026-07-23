"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ReportData {
  report: Record<string, any>;
  finance: Record<string, any>[];
  shots: Record<string, any>[];
  assets: Record<string, any>[];
}

export default function ReportViewPage() {
  const params = useParams();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        if (!res.ok) throw new Error("Informe no encontrado");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchReport();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando informe...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error || "Informe no encontrado"}</div>
      </div>
    );
  }

  const { report, finance, shots, assets } = data;
  const currency = (report["Currency"] as "EUR" | "USD") || "EUR";
  const code = report["CODE"]?.[0] || report["Report ID"]?.split("-")[0] || "";

  // Finance totals
  const totalBudgeted = finance.reduce((s, r) => s + (r["Budgeted Cost"] || 0), 0);
  const totalEfc = finance.reduce((s, r) => s + (r["EFC"] || 0), 0);

  // Shots totals
  const totalShots = shots.reduce((s, r) => s + (r["Total Shots"] || 0), 0);
  const totalDelivered = shots.reduce((s, r) => s + (r["Final Delivered"] || 0), 0);
  const totalOmit = shots.reduce((s, r) => s + (r["Omit CTD"] || 0), 0);
  const percentComplete = totalShots > 0 ? (((totalDelivered + totalOmit) / totalShots) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{code}</h1>
              <p className="text-sm text-gray-500">VFX Status Report</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Week Ending</p>
              <p className="text-lg font-bold text-gray-900">{formatDate(report["Week Ending"])}</p>
              <p className="text-xs text-gray-500 mt-1">Enviado por: {report["Submitted By"]}</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Presupuesto</p>
            <p className="text-lg font-bold">{formatCurrency(totalBudgeted, currency)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">EFC</p>
            <p className="text-lg font-bold">{formatCurrency(totalEfc, currency)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Varianza</p>
            <p className={`text-lg font-bold ${totalBudgeted - totalEfc >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(totalBudgeted - totalEfc, currency)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500">Shots Completados</p>
            <p className="text-lg font-bold">{percentComplete}%</p>
          </div>
        </div>

        {/* Finance Table */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">💰 Finance Tracking</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-2">Episode/Reel</th>
                  <th className="text-left py-2 pr-2">Cut Status</th>
                  <th className="text-right py-2 pr-2">Budget</th>
                  <th className="text-right py-2 pr-2">EFC</th>
                  <th className="text-right py-2">Variance</th>
                </tr>
              </thead>
              <tbody>
                {finance.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-2">{r["Episode / Reel"]}</td>
                    <td className="py-2 pr-2">{r["Cut Status"] || "—"}</td>
                    <td className="py-2 pr-2 text-right">{formatCurrency(r["Budgeted Cost"] || 0, currency)}</td>
                    <td className="py-2 pr-2 text-right">{formatCurrency(r["EFC"] || 0, currency)}</td>
                    <td className={`py-2 text-right ${(r["Budgeted Cost"] || 0) - (r["EFC"] || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency((r["Budgeted Cost"] || 0) - (r["EFC"] || 0), currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shots Table */}
        <div className="bg-white border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">🎯 Shot Tracking</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-2 pr-2">Episode/Reel</th>
                  <th className="text-right py-2 pr-2">Total</th>
                  <th className="text-right py-2 pr-2">In Progress</th>
                  <th className="text-right py-2 pr-2">Delivered</th>
                  <th className="text-right py-2 pr-2">On Hold</th>
                  <th className="text-right py-2 pr-2">Omit</th>
                  <th className="text-right py-2">% Complete</th>
                </tr>
              </thead>
              <tbody>
                {shots.map((r, i) => {
                  const st = r["Total Shots"] || 0;
                  const pct = st > 0 ? (((r["Final Delivered"] || 0) + (r["Omit CTD"] || 0)) / st * 100).toFixed(1) : "0";
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-2">{r["Episode / Reel"]}</td>
                      <td className="py-2 pr-2 text-right font-medium">{st}</td>
                      <td className="py-2 pr-2 text-right text-yellow-600">{r["In Progress"] || 0}</td>
                      <td className="py-2 pr-2 text-right text-emerald-600">{r["Final Delivered"] || 0}</td>
                      <td className="py-2 pr-2 text-right text-orange-600">{r["On Hold"] || 0}</td>
                      <td className="py-2 pr-2 text-right text-gray-500">{r["Omit CTD"] || 0}</td>
                      <td className="py-2 text-right font-medium">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Assets Table */}
        {assets.length > 0 && (
          <div className="bg-white border rounded-xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">🎨 Asset Tracking</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 pr-2">Asset</th>
                    <th className="text-left py-2 pr-2">Episodes</th>
                    <th className="text-left py-2 pr-2">Vendor</th>
                    <th className="text-left py-2 pr-2">Status</th>
                    <th className="text-right py-2">% Complete</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 pr-2 font-medium">{r["Asset Name"]}</td>
                      <td className="py-2 pr-2">{r["Episode(s)"] || "—"}</td>
                      <td className="py-2 pr-2">{r["Vendor(s)"] || "—"}</td>
                      <td className="py-2 pr-2">{r["Status"] || "—"}</td>
                      <td className="py-2 text-right">{((r["% Complete"] || 0) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Narrative */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">📝 Informe Narrativo</h2>

          {report["Progress & Key Developments"] && (
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase">Progress & Key Developments</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{report["Progress & Key Developments"]}</p>
            </div>
          )}

          {report["Finance Updates"] && (
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase">Finance Updates</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{report["Finance Updates"]}</p>
            </div>
          )}

          {report["Warnings"] && (
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase">Warnings</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{report["Warnings"]}</p>
            </div>
          )}

          {report["Noteworthy"] && (
            <div>
              <p className="text-sm font-bold text-gray-900 uppercase">Noteworthy</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{report["Noteworthy"]}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-400">
          VFX Status Report — Amazon International Originals
        </div>
      </div>
    </div>
  );
}
