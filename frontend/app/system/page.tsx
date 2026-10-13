"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  HardDrive,
  Cpu,
  Server,
  Zap,
  Boxes,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SystemPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = () => {
    api.getSystemStatus()
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const frameworks = status?.frameworks || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">System Health</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time backend telemetry, hardware metrics, and machine learning framework availability.
          </p>
        </div>

        <button
          onClick={loadStatus}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Telemetry
        </button>
      </div>

      {/* Hardware Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Cpu className="w-4 h-4 text-violet-400" />
              CPU Utilization
            </span>
            <span className="font-mono text-white font-bold">{status?.cpu_usage_pct ?? 0}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, status?.cpu_usage_pct || 15)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500">Multiprocessing active</div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <Server className="w-4 h-4 text-indigo-400" />
              Memory (RAM)
            </span>
            <span className="font-mono text-white font-bold">{status?.memory_usage_pct ?? 0}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, status?.memory_usage_pct || 40)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500">
            {status?.memory_used_gb} GB used of {status?.memory_total_gb} GB
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Disk Storage
            </span>
            <span className="font-mono text-white font-bold">{status?.disk_usage_pct ?? 0}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, status?.disk_usage_pct || 30)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500">
            {status?.disk_space_used_gb} GB used of {status?.disk_space_total_gb} GB
          </div>
        </div>
      </div>

      {/* ML Framework Availability Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Machine Learning Frameworks & Runtimes</h2>
        </div>
        <div className="divide-y divide-white/5 text-xs text-slate-300">
          {Object.keys(frameworks).map((name) => {
            const fw = frameworks[name];
            return (
              <div key={name} className="p-4 px-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/10 text-violet-400 flex items-center justify-center font-bold text-xs">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{fw.name}</div>
                    <div className="text-[11px] text-slate-500">
                      Version: {fw.version || "Detected"} • Device: {fw.device || "CPU"}
                    </div>
                  </div>
                </div>

                <div>
                  {fw.available ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Available
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-500 border border-white/5">
                      Not Installed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
