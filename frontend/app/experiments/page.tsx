"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Layers,
  Cpu,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [frameworkFilter, setFrameworkFilter] = useState("all");

  useEffect(() => {
    api.getExperiments()
      .then((data) => {
        setExperiments(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading experiments:", err);
        setLoading(false);
      });
  }, []);

  const filtered = experiments.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.model_type.toLowerCase().includes(search.toLowerCase());
    const matchesTask = taskFilter === "all" || e.task_type.toLowerCase() === taskFilter.toLowerCase();
    const matchesFramework = frameworkFilter === "all" || e.framework.toLowerCase() === frameworkFilter.toLowerCase();
    return matchesSearch && matchesTask && matchesFramework;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Experiments</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, evaluate and compare model training experiments.
          </p>
        </div>

        <Link
          href="/experiments/new"
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          Create Experiment
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search experiments by name or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={taskFilter}
            onChange={(e) => setTaskFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Tasks</option>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
          </select>

          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Frameworks</option>
            <option value="scikit-learn">Scikit-learn</option>
            <option value="pytorch">PyTorch</option>
          </select>
        </div>
      </div>

      {/* Experiments Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3.5 px-6">Experiment Name</th>
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Framework</th>
                <th className="py-3.5 px-4">Model Architecture</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Primary Metric</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((exp) => {
                const isClass = exp.task_type === "classification";
                const metricVal = isClass
                  ? `Accuracy: ${exp.metrics?.accuracy ?? "N/A"}`
                  : `R²: ${exp.metrics?.r2_score ?? "N/A"}`;

                return (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      <Link href={`/experiments/${exp.id}`} className="hover:text-violet-400 flex items-center gap-2">
                        {exp.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 capitalize text-slate-400">{exp.task_type}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {exp.framework}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-300">{exp.model_type}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-emerald-400 font-medium">{metricVal}</td>
                    <td className="py-4 px-4 text-slate-400">{exp.training_duration_sec}s</td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        Details
                        <ExternalLink className="w-3 h-3" />
                      </Link>
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
