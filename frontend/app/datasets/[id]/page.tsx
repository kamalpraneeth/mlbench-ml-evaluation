"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  BarChart3,
  ListFilter,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

function DatasetExplorerContent() {
  const params = useParams();
  const id = params?.id as string;

  const [dataset, setDataset] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [quality, setQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Preview" | "Profile" | "Missing" | "Statistics">("Preview");

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getDataset(id),
        api.getDatasetPreview(id),
        api.getDatasetQuality(id),
      ])
        .then(([ds, prev, qlty]) => {
          setDataset(ds);
          setPreview(prev);
          setQuality(qlty);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block mb-3"></span>
        <div>Profiling dataset...</div>
      </div>
    );
  }

  if (!dataset) {
    return <div className="p-12 text-center text-red-400">Dataset not found.</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/datasets" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Datasets
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-mono">{dataset.filename}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-violet-400" />
              {dataset.name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              File: <code className="text-indigo-300">{dataset.filename}</code> • Target: <code className="text-violet-400">{dataset.target_column}</code> • {dataset.row_count} rows • {dataset.col_count} columns
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0f172a] border border-white/5 flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Data Quality Score</span>
                <span className="text-lg font-bold text-emerald-400">{quality?.quality_score ?? 100}%</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-medium">
        {(["Preview", "Profile", "Missing", "Statistics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-violet-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {tab === "Preview" ? "Data Preview" : tab === "Profile" ? "Column Profile" : tab === "Missing" ? "Missing Values" : "Summary Statistics"}
          </button>
        ))}
      </div>

      {/* TAB 1: PREVIEW TABLE */}
      {activeTab === "Preview" && preview && (
        <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 text-xs text-slate-400">
            Showing first {preview.rows.length} rows of {preview.total_rows.toLocaleString()} total entries
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-semibold sticky top-0 uppercase text-[10px] tracking-wider">
                <tr>
                  {preview.columns.map((col: string) => (
                    <th key={col} className="py-3 px-4 whitespace-nowrap">
                      {col}
                      {col === dataset.target_column && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-violet-500/20 text-violet-300 font-normal">
                          TARGET
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {preview.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                    {preview.columns.map((col: string) => (
                      <td key={col} className="py-2.5 px-4 whitespace-nowrap text-xs">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COLUMN PROFILE */}
      {activeTab === "Profile" && quality && (
        <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Column Name</th>
                  <th className="py-3.5 px-4">Data Type</th>
                  <th className="py-3.5 px-4">Unique Values</th>
                  <th className="py-3.5 px-4">Missing Count</th>
                  <th className="py-3.5 px-4">Missing %</th>
                  <th className="py-3.5 px-4">Is Numeric</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {quality.columns.map((col: any) => (
                  <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-semibold text-white font-mono">{col.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{col.dtype}</td>
                    <td className="py-3 px-4 font-mono">{col.unique_count}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{col.missing_count}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={col.missing_pct > 0 ? "text-amber-400" : "text-emerald-400"}>
                        {col.missing_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {col.is_numeric ? (
                        <span className="text-emerald-400 font-medium">True</span>
                      ) : (
                        <span className="text-slate-500 font-medium">False</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MISSING VALUES */}
      {activeTab === "Missing" && quality && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Missing Cells: <strong className="text-white">{quality.missing_values_total}</strong></span>
            <span>Duplicate Rows: <strong className="text-white">{quality.duplicate_rows_count}</strong></span>
          </div>
          <div className="space-y-3">
            {quality.columns.map((col: any) => (
              <div key={col.name} className="p-3 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
                <span className="font-mono text-white">{col.name}</span>
                <span className="text-slate-400">{col.missing_count} missing ({col.missing_pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STATISTICS */}
      {activeTab === "Statistics" && quality && (
        <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Numeric Column</th>
                  <th className="py-3.5 px-4">Mean</th>
                  <th className="py-3.5 px-4">Std Dev</th>
                  <th className="py-3.5 px-4">Min</th>
                  <th className="py-3.5 px-4">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {quality.columns.filter((c: any) => c.is_numeric).map((col: any) => (
                  <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-semibold text-white">{col.name}</td>
                    <td className="py-3 px-4 text-emerald-400">{col.mean ?? "N/A"}</td>
                    <td className="py-3 px-4">{col.std ?? "N/A"}</td>
                    <td className="py-3 px-4">{col.min ?? "N/A"}</td>
                    <td className="py-3 px-4">{col.max ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DatasetExplorerPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading dataset...</div>}>
      <DatasetExplorerContent />
    </Suspense>
  );
}
