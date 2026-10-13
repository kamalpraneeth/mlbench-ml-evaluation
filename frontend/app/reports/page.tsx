"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  useEffect(() => {
    api.getReports()
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExport = (reportId: string, format: "json" | "csv") => {
    window.open(`http://localhost:8000/api/v1/reports/${reportId}/export?format=${format}`, "_blank");
  };

  const filtered = reports.filter((r) =>
    typeFilter === "all" ? true : r.report_type.toLowerCase() === typeFilter.toLowerCase()
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Reports</h1>
          <p className="text-sm text-slate-400 mt-1">
            View, audit and export historical evaluation and cross-runtime benchmark reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 font-medium"
          >
            <option value="all">All Types</option>
            <option value="evaluation">Evaluation Reports</option>
            <option value="benchmark">Benchmark Reports</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3.5 px-6">Report Title</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Summary Metrics</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created At</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span>{r.title}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {r.report_type}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-300">
                    {r.summary ? JSON.stringify(r.summary).slice(0, 40) + "..." : "Completed"}
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Generated
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedReport(r)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white font-medium text-xs transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleExport(r.id, "csv")}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-400 font-medium text-xs flex items-center gap-1"
                        title="Download CSV"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport(r.id, "json")}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-medium text-xs flex items-center gap-1"
                        title="Download JSON"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 className="text-base font-bold text-white">{selectedReport.title}</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Report Data JSON:</span>
              <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-60">
                {JSON.stringify(selectedReport, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleExport(selectedReport.id, "csv")}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
