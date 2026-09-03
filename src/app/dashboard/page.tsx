"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { WeeklyReport, Project } from "@/lib/airtable";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  Plus,
  LogOut,
  CheckCircle,
  LayoutDashboard,
  Film,
} from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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

    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          setProjects(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    }

    if (status === "authenticated") {
      fetchReports();
      fetchProjects();
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

  // Projects the user can access (admin sees all, coordinator sees assigned)
  const activeProjects =
    session.user.role === "admin"
      ? projects
      : projects.filter((p) => session.user.projects?.includes(p.code));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">VFX</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                VFX Status Reports
              </h1>
              <p className="text-xs text-slate-300">
                {session.user.role === "admin"
                  ? "Vista Ejecutiva"
                  : "Panel del Coordinador"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-200 hidden sm:block">
              {session.user.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
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

        {/* Active projects */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2 mb-4">
            <Film size={18} />
            Proyectos activos
          </h2>
          {activeProjects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-400">
              No hay proyectos activos asignados.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProjects.map((project) => (
                <div
                  key={project.code}
                  className="bg-slate-200 border border-slate-300 rounded-xl p-4 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {project.code?.slice(0, 4) || "—"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {project.code}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {project.name || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-2">
            <LayoutDashboard size={18} />
            Weekly Status Reports
          </h2>
          <Link
            href="/report/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors"
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
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">No hay informes todavía</p>
            <Link
              href="/report/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Plus size={16} /> Crear primer informe
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">
                      Report ID
                    </th>
                    {session.user.role === "admin" && (
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">
                        Enviado por
                      </th>
                    )}
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">
                      Semana
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">
                      Ver
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                        {report.code && report.weekEnding
                          ? `${report.code}-${report.weekEnding}`
                          : report.code || "—"}
                      </td>
                      {session.user.role === "admin" && (
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {report.submittedBy}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(report.weekEnding)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/report/${report.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800"
                        >
                          Ver informe →
                        </Link>
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
