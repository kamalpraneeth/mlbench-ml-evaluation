"use client";

import { useEffect, useState } from "react";
import {
  Workflow,
  Play,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  const loadPipelines = () => {
    api.getPipelines()
      .then((data) => {
        setPipelines(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPipelines();
  }, []);

  const handleTrigger = async (id: string) => {
    setTriggeringId(id);
    try {
      await api.triggerPipeline(id);
      loadPipelines();
    } catch (err: any) {
      alert("Failed to trigger pipeline: " + err.message);
    } finally {
      setTriggeringId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Pipelines</h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated model evaluation, scheduled benchmarking, and drift detection orchestration.
          </p>
        </div>

        <button
          onClick={loadPipelines}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Status
        </button>
      </div>

      {/* Pipelines Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3.5 px-6">Pipeline Name</th>
                <th className="py-3.5 px-4">Trigger Type</th>
                <th className="py-3.5 px-4">Schedule (Cron)</th>
                <th className="py-3.5 px-4">Latest Run</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {pipelines.map((p) => {
                const isRunning = triggeringId === p.id || p.status === "Running";
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-2.5">
                      <Workflow className="w-4 h-4 text-violet-400" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 capitalize">{p.trigger_type}</td>
                    <td className="py-4 px-4 font-mono text-[11px] text-indigo-300">{p.schedule}</td>
                    <td className="py-4 px-4 text-slate-400">
                      {p.last_run ? new Date(p.last_run).toLocaleString() : "Pending"}
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-300">{p.duration_sec}s</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : p.status === "Running"
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse"
                            : "bg-slate-800 text-slate-400 border-white/5"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleTrigger(p.id)}
                        disabled={isRunning}
                        className="px-3.5 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-semibold text-xs transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isRunning ? (
                          <>
                            <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            Run Now
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
