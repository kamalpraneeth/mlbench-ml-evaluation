"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GitCompare,
  CheckCircle2,
  Download,
  Boxes,
  Plus,
  X,
  Gauge,
  Clock,
  Cpu,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ComparePage() {
  const [allModels, setAllModels] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Performance" | "Inference" | "Details">("Performance");

  useEffect(() => {
    api.getModels()
      .then((models) => {
        setAllModels(models);
        if (models.length > 0) {
          const ids = models.slice(0, 3).map((m) => m.id);
          setSelectedIds(ids);
          return api.compareModels(ids);
        }
      })
      .then((comp) => {
        if (comp) setComparison(comp);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleToggleModel = async (id: string) => {
    let newIds: string[];
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 1) return; // Keep at least 1
      newIds = selectedIds.filter((x) => x !== id);
    } else {
      newIds = [...selectedIds, id];
    }
    setSelectedIds(newIds);
    try {
      const comp = await api.compareModels(newIds);
      setComparison(comp);
    } catch (err) {
      console.error(err);
    }
  };

  const isClass = comparison?.task_type === "classification";
  const models = comparison?.models || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Model Comparison</h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare evaluation accuracy and inference latencies across models and runtimes.
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comparison, null, 2));
            const dlAnchor = document.createElement("a");
            dlAnchor.setAttribute("href", dataStr);
            dlAnchor.setAttribute("download", "mlbench_model_comparison.json");
            dlAnchor.click();
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          Export Comparison
        </button>
      </div>

      {/* Model Selection Pills */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-white/5 space-y-3">
        <label className="block text-xs font-semibold text-slate-400">Selected Models for Comparison:</label>
        <div className="flex flex-wrap items-center gap-2">
          {allModels.map((m) => {
            const isSelected = selectedIds.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => handleToggleModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-sm font-semibold border border-violet-500"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <span>{m.name}</span>
                {isSelected && <X className="w-3 h-3 text-violet-200 hover:text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-medium">
        {(["Performance", "Inference", "Details"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-violet-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {tab === "Performance" ? "Performance Metrics" : tab === "Inference" ? "Inference Performance" : "Model Details"}
          </button>
        ))}
      </div>

      {/* Comparison Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-white/5 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6 w-1/4">Metric</th>
                {models.map((m: any) => (
                  <th key={m.model_id} className="py-4 px-6 text-white font-bold">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {activeTab === "Performance" && (
                <>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">{isClass ? "Accuracy" : "R² Score"}</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-emerald-400 font-bold">
                        {isClass ? m.accuracy ?? "N/A" : m.r2 ?? "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">{isClass ? "Precision" : "MAE"}</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-white">
                        {isClass ? m.precision ?? "N/A" : m.mae ?? "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">{isClass ? "Recall" : "RMSE"}</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-white">
                        {isClass ? m.recall ?? "N/A" : m.rmse ?? "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">{isClass ? "F1 Score" : "MSE"}</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-indigo-400 font-bold">
                        {isClass ? m.f1 ?? "N/A" : m.mse ?? "N/A"}
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {activeTab === "Inference" && (
                <>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Mean Latency (ms)</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-emerald-400 font-bold">
                        {m.mean_latency_ms ? `${m.mean_latency_ms} ms` : "Not benchmarked"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">P95 Latency (ms)</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-white">
                        {m.p95_latency_ms ? `${m.p95_latency_ms} ms` : "Not benchmarked"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Throughput (samples/s)</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-indigo-400 font-bold">
                        {m.throughput_sps ? `${m.throughput_sps.toLocaleString()} sps` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Memory Footprint (MB)</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-slate-300">
                        {m.memory_mb ? `${m.memory_mb} MB` : "N/A"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Prediction Consistency Check</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-medium">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {m.consistency_passed ? "PASSED (rtol < 1e-3)" : "FAILED"}
                        </span>
                      </td>
                    ))}
                  </tr>
                </>
              )}

              {activeTab === "Details" && (
                <>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Framework</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-semibold capitalize text-indigo-300">
                        {m.framework}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Task Type</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 capitalize text-slate-300">
                        {m.task_type}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Model File Size</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6 font-mono text-slate-300">
                        {m.model_size_mb} MB
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3.5 px-6 font-semibold text-slate-400">Supported Inference Runtimes</td>
                    {models.map((m: any) => (
                      <td key={m.model_id} className="py-3.5 px-6">
                        <div className="flex gap-1 flex-wrap">
                          {m.supported_runtimes.map((rt: string) => (
                            <span key={rt} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-white/5 uppercase">
                              {rt}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
