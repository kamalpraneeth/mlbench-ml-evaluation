"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Gauge,
  CheckCircle2,
  ExternalLink,
  Search,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";

export default function ModelsPage() {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getModels()
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.framework.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Model Registry</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered model artifacts with multi-runtime export configurations.
          </p>
        </div>

        <Link
          href="/compare"
          className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 flex items-center gap-2"
        >
          Compare Models
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search registered models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Models Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3.5 px-6">Model Name</th>
                <th className="py-3.5 px-4">Framework</th>
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Validation Status</th>
                <th className="py-3.5 px-4">Supported Formats</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filtered.map((m) => {
                const formats: string[] = m.formats || ["native"];
                const sizeKb = (m.artifact_size_bytes / 1024).toFixed(1);

                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">
                      <Link href={`/models/${m.id}`} className="hover:text-violet-400 flex items-center gap-2">
                        {m.name}
                      </Link>
                    </td>
                    <td className="py-4 px-4 capitalize text-indigo-300 font-medium">{m.framework}</td>
                    <td className="py-4 px-4 capitalize text-slate-400">{m.task_type}</td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-300">{m.version}</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        {m.validation_status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {formats.map((fmt) => (
                          <span
                            key={fmt}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-white/10 text-slate-300"
                          >
                            {fmt.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-400">{sizeKb} KB</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/models/${m.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white font-medium text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 text-emerald-400" />
                          Test
                        </Link>
                        <Link
                          href="/benchmarks"
                          className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Gauge className="w-3 h-3 text-violet-400" />
                          Benchmark
                        </Link>
                      </div>
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
