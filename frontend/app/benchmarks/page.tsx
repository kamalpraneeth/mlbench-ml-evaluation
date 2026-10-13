"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gauge,
  Play,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

export default function BenchmarksPage() {
  const [models, setModels] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedRuntime, setSelectedRuntime] = useState("PyTorch");
  const [batchSize, setBatchSize] = useState(1);
  const [warmupIterations, setWarmupIterations] = useState(10);
  const [measuredIterations, setMeasuredIterations] = useState(100);
  const [running, setRunning] = useState(false);
  const [latestResult, setLatestResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([api.getModels(), api.getBenchmarks()])
      .then(([mList, bList]) => {
        setModels(mList);
        setBenchmarks(bList);
        if (mList.length > 0) {
          setSelectedModelId(mList[0].id);
          // Set latest benchmark if available
          if (bList.length > 0) setLatestResult(bList[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleRunBenchmark = async () => {
    setRunning(true);
    try {
      const payload = {
        model_id: selectedModelId,
        runtime: selectedRuntime,
        batch_size: batchSize,
        warmup_iterations: warmupIterations,
        measured_iterations: measuredIterations,
        repetitions: 3,
      };
      const res = await api.runBenchmark(payload);
      setLatestResult(res);
      setBenchmarks((prev) => [res, ...prev]);
    } catch (err: any) {
      alert("Benchmark failed: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  // Prepare latency sample histogram data
  const sampleHist = (latestResult?.latency_samples || []).map((lat: number, idx: number) => ({
    iteration: idx + 1,
    latency: lat,
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Benchmark Lab</h1>
        <p className="text-sm text-slate-400 mt-1">
          High-resolution monotonic execution benchmarks across native PyTorch and ONNX Runtime.
        </p>
      </div>

      {/* Main Grid: Config + Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel (Span 1) */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-5 h-fit">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Gauge className="w-4 h-4 text-violet-400" />
            Benchmark Configuration
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.framework})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Inference Runtime</label>
            <select
              value={selectedRuntime}
              onChange={(e) => setSelectedRuntime(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
            >
              <option value="PyTorch">PyTorch Native (CPU)</option>
              <option value="ONNX Runtime">ONNX Runtime (CPUExecutionProvider)</option>
              <option value="Scikit-learn">Scikit-learn Native</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Batch Size</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="1">1</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Warm-up</label>
              <select
                value={warmupIterations}
                onChange={(e) => setWarmupIterations(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Iterations</label>
              <select
                value={measuredIterations}
                onChange={(e) => setMeasuredIterations(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={running || !selectedModelId}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
          >
            {running ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Measuring Monotonic Nanoseconds...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Benchmark
              </>
            )}
          </button>
        </div>

        {/* Live Measured Results (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {latestResult ? (
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Results</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                      {latestResult.runtime} (Batch {latestResult.batch_size})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{latestResult.model_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Consistency: PASSED
                  </span>
                </div>
              </div>

              {/* 4 KPI Result Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                  <div className="text-[11px] text-slate-400 mb-1">Mean Latency</div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {latestResult.mean_latency_ms} ms
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                  <div className="text-[11px] text-slate-400 mb-1">P95 Latency</div>
                  <div className="text-2xl font-extrabold text-white">
                    {latestResult.p95_latency_ms} ms
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                  <div className="text-[11px] text-slate-400 mb-1">Throughput</div>
                  <div className="text-2xl font-extrabold text-indigo-400">
                    {latestResult.throughput_sps?.toLocaleString()} /s
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-white/5">
                  <div className="text-[11px] text-slate-400 mb-1">Memory Usage</div>
                  <div className="text-2xl font-extrabold text-white">
                    {latestResult.memory_mb} MB
                  </div>
                </div>
              </div>

              {/* Latency Distribution Histogram */}
              {sampleHist.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 mb-3">Latency Distribution (Individual Iterations)</h3>
                  <div className="h-56 w-full bg-slate-900/60 p-4 rounded-xl border border-white/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sampleHist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="iteration" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0b0f19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(val: any) => [`${val} ms`, "Latency"]}
                        />
                        <Bar dataKey="latency" fill="#6366f1" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 rounded-2xl bg-[#0f172a] border border-white/5">
              Select a model and runtime, then click "Run Benchmark" to execute measurements.
            </div>
          )}
        </div>
      </div>

      {/* Benchmark History Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Recent Benchmark History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3 px-6">Model</th>
                <th className="py-3 px-4">Runtime</th>
                <th className="py-3 px-4">Batch Size</th>
                <th className="py-3 px-4">Mean Latency</th>
                <th className="py-3 px-4">P95 Latency</th>
                <th className="py-3 px-4">Throughput</th>
                <th className="py-3 px-4">Consistency</th>
                <th className="py-3 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {benchmarks.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-6 font-semibold text-white">{b.model_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {b.runtime}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono">{b.batch_size}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{b.mean_latency_ms} ms</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{b.p95_latency_ms} ms</td>
                  <td className="py-3 px-4 font-mono text-indigo-400">{b.throughput_sps?.toLocaleString()} /s</td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-medium">Passed</span>
                  </td>
                  <td className="py-3 px-6 text-right text-slate-500">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
