"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { WeeklyReport } from "@/lib/airtable";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  LogOut,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const justSubmitted = searchParams.get("submitted") === "true";
  const reportId = searchParams.get("reportId");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports/history");
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") {
      fetchReports();
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">VFX</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                VFX Status Reports
              </h1>
              <p className="text-xs text-gray-500">
                {session.user.role === "admin"
                  ? "Vista Ejecutiva"
                  : "Panel del Coordinador"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Success banner */}
        {justSubmitted && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-600" size={20} />
              <p className="text-sm text-emerald-700 font-medium">
                ¡Informe enviado correctamente! Los datos ya están disponibles en Airtable.
              </p>
            </div>
            {reportId && (
              <Link
                href={`/report/${reportId}`}
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-900"
              >
                Ver informe →
              </Link>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutDashboard size={20} />
            {session.user.role === "admin"
              ? "Todos los Informes"
              : "Mis Informes"}
          </h2>
          <Link
            href="/report/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Nuevo Informe
          </Link>
        </div>

        {/* Reports list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Cargando informes...
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay informes todavía</p>
            <Link
              href="/report/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus size={16} /> Crear primer informe
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Semana
                    </th>
                    {session.user.role === "admin" && (
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                        Enviado por
                      </th>
                    )}
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      WBR Summary
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">
                      Proyecto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatDate(report.weekEnding)}
                      </td>
                      {session.user.role === "admin" && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {report.submittedBy}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                        {report.progress || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-700">
                        {report.code || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Cargando...</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
