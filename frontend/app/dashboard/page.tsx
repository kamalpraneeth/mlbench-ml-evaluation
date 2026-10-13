"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Boxes,
  Gauge,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetricTab, setActiveMetricTab] = useState<"Accuracy" | "F1 Score" | "R2">("Accuracy");
  const [latencyTab, setLatencyTab] = useState<"Mean" | "P95" | "Throughput">("Mean");

  useEffect(() => {
    api.getDashboardSummary()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, []);

  const perfChartData = data?.performance_comparison || [
    { dataset: "Customer Support", Scikit_learn: 0.88, PyTorch: 0.92, ONNX_Runtime: 0.92, TFLite: 0.90 },
    { dataset: "House Price", Scikit_learn: 0.89, PyTorch: 0.94, ONNX_Runtime: 0.94, TFLite: 0.91 },
    { dataset: "Log Analytics", Scikit_learn: 0.91, PyTorch: 0.95, ONNX_Runtime: 0.95, TFLite: 0.92 },
    { dataset: "Medical OCR", Scikit_learn: 0.84, PyTorch: 0.90, ONNX_Runtime: 0.90, TFLite: 0.88 },
  ];

  const latencyChartData = data?.latency_comparison || [
    { batch_size: "1", PyTorch: 12.4, ONNX_Runtime: 7.8, TFLite: 14.1 },
    { batch_size: "8", PyTorch: 18.2, ONNX_Runtime: 11.2, TFLite: 22.4 },
    { batch_size: "16", PyTorch: 26.5, ONNX_Runtime: 15.6, TFLite: 34.0 },
    { batch_size: "32", PyTorch: 42.1, ONNX_Runtime: 24.3, TFLite: 55.2 },
    { batch_size: "64", PyTorch: 74.0, ONNX_Runtime: 41.5, TFLite: 92.8 },
  ];

  const recentExperiments = data?.recent_experiments || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your ML experiments, models and benchmark results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>All time</option>
          </select>

          <Link
            href="/experiments/new"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            New Experiment
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Experiments */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 relative overflow-hidden glow-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Total Experiments</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {data ? data.total_experiments : 24}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 12% from last month</span>
          </div>
        </div>

        {/* Models Registered */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 relative overflow-hidden glow-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Models Registered</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {data ? data.models_registered : 12}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 33% from last month</span>
          </div>
        </div>

        {/* Benchmark Runs */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 relative overflow-hidden glow-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Benchmark Runs</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {data ? data.benchmark_runs : 36}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>↑ 28% from last month</span>
          </div>
        </div>

        {/* Avg Inference Latency */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5 relative overflow-hidden glow-card">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-3">
            <span>Avg Inference Latency</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {data ? `${data.avg_inference_latency_ms} ms` : "18.4 ms"}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>↓ 24% from last month</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Performance Comparison Chart */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Model Performance Comparison</h2>
              <p className="text-xs text-slate-400">Accuracy & F1 score across target datasets</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5 text-xs">
              {(["Accuracy", "F1 Score", "R2"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMetricTab(tab)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    activeMetricTab === tab
                      ? "bg-violet-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "R2" ? "R²" : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dataset" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 1.0]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Scikit_learn" name="Scikit-learn" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PyTorch" name="PyTorch" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ONNX_Runtime" name="ONNX Runtime" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="TFLite" name="TFLite" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Latency Comparison Chart */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Inference Latency Comparison</h2>
              <p className="text-xs text-slate-400">Execution latency vs batch size (ms)</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5 text-xs">
              {(["Mean", "P95", "Throughput"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLatencyTab(tab)}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    latencyTab === tab
                      ? "bg-violet-600 text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="batch_size" stroke="#64748b" fontSize={11} tickLine={false} label={{ value: "Batch Size", position: "insideBottom", offset: -5, fontSize: 10, fill: "#64748b" }} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line type="monotone" dataKey="PyTorch" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ONNX_Runtime" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="TFLite" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Experiments & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Experiments (Span 2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f172a] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Recent Experiments</h2>
            <Link href="/experiments" className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1">
              View all
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Metrics</th>
                  <th className="pb-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {recentExperiments.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium text-white">
                      <Link href={`/experiments/${exp.id}`} className="hover:text-violet-400">
                        {exp.name}
                      </Link>
                    </td>
                    <td className="py-3 capitalize text-slate-400">{exp.task}</td>
                    <td className="py-3 font-mono text-[11px] text-indigo-300">{exp.model}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {exp.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-300">{exp.metric}</td>
                    <td className="py-3 text-slate-500">{exp.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Status Card (Span 1) */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-4">System Status</h2>
            <div className="space-y-3.5">
              {[
                { name: "API Server", status: "Healthy", color: "text-emerald-400" },
                { name: "Database", status: "Connected", color: "text-emerald-400" },
                { name: "PyTorch", status: "Available", color: "text-emerald-400" },
                { name: "ONNX Runtime", status: "Available", color: "text-emerald-400" },
                { name: "TensorFlow Lite", status: "Available", color: "text-emerald-400" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {item.name}
                  </span>
                  <span className={`font-semibold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/system"
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-center text-xs font-semibold text-slate-300 transition-colors block"
          >
            View Infrastructure Telemetry
          </Link>
        </div>
      </div>
    </div>
  );
}
