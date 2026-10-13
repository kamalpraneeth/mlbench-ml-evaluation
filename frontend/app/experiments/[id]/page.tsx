"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Layers,
  Cpu,
  FileText,
  Boxes,
  Gauge,
  Download,
  Terminal,
} from "lucide-react";
import {
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

function ExperimentContent() {
  const params = useParams();
  const id = params?.id as string;

  const [exp, setExp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"Overview" | "Metrics" | "Logs" | "Artifacts" | "Configuration">("Metrics");

  useEffect(() => {
    if (id) {
      api.getExperiment(id)
        .then((data) => {
          setExp(data);
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
        <div>Loading experiment metadata...</div>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="p-12 text-center text-red-400 text-sm">
        Experiment not found.
      </div>
    );
  }

  const isClass = exp.task_type === "classification";
  const metrics = exp.metrics || {};
  const cm = exp.confusion_matrix;
  const lossCurve = exp.loss_curve || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Link href="/experiments" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Experiments
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-mono">{exp.id.slice(0, 8)}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{exp.name}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {exp.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Framework: <span className="text-indigo-400 font-medium">{exp.framework}</span> • Architecture: <span className="font-mono text-slate-300">{exp.model_type}</span> • Duration: {exp.training_duration_sec}s
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/benchmarks"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 flex items-center gap-2"
          >
            <Gauge className="w-3.5 h-3.5" />
            Benchmark Model
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-medium">
        {(["Metrics", "Overview", "Logs", "Artifacts", "Configuration"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab
                ? "bg-violet-600 text-white font-semibold shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: METRICS */}
      {activeTab === "Metrics" && (
        <div className="space-y-6">
          {/* Top Performance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {isClass ? (
              <>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Accuracy</div>
                  <div className="text-3xl font-extrabold text-emerald-400">{metrics.accuracy ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Precision</div>
                  <div className="text-3xl font-extrabold text-white">{metrics.precision ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Recall</div>
                  <div className="text-3xl font-extrabold text-white">{metrics.recall ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">F1 Score</div>
                  <div className="text-3xl font-extrabold text-indigo-400">{metrics.f1_score ?? "0.000"}</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">R² Score</div>
                  <div className="text-3xl font-extrabold text-emerald-400">{metrics.r2_score ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">MAE</div>
                  <div className="text-3xl font-extrabold text-white">{metrics.mae ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">RMSE</div>
                  <div className="text-3xl font-extrabold text-white">{metrics.rmse ?? "0.000"}</div>
                </div>
                <div className="p-5 rounded-xl bg-[#0f172a] border border-white/5">
                  <div className="text-xs text-slate-400 mb-1">Test Samples</div>
                  <div className="text-3xl font-extrabold text-indigo-400">{metrics.sample_count ?? 0}</div>
                </div>
              </>
            )}
          </div>

          {/* Visual Grid: Confusion Matrix & Loss Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Table */}
            {cm && cm.matrix ? (
              <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                  <span>Confusion Matrix</span>
                  <span className="text-[11px] text-slate-400 font-normal">Held-out test set ({cm.total_samples} samples)</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-left text-slate-500 font-semibold text-[10px]">Actual \ Pred</th>
                        {cm.labels.map((lbl: string) => (
                          <th key={lbl} className="p-2 text-slate-400 font-medium text-[11px]">{lbl}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cm.matrix.map((row: number[], rIdx: number) => (
                        <tr key={rIdx}>
                          <td className="p-2 text-left font-medium text-slate-400 text-[11px]">{cm.labels[rIdx]}</td>
                          {row.map((val: number, cIdx: number) => {
                            const isDiagonal = rIdx === cIdx;
                            return (
                              <td key={cIdx} className="p-1">
                                <div
                                  className={`py-2 px-3 rounded font-mono text-xs font-bold transition-all ${
                                    isDiagonal
                                      ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                                      : val > 0
                                      ? "bg-slate-800/80 text-slate-400"
                                      : "bg-slate-900 text-slate-600"
                                  }`}
                                >
                                  {val}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Training Loss Curve */}
            {lossCurve.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4">Training vs Validation Loss Curve</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lossCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="epoch" stroke="#64748b" fontSize={11} tickLine={false} label={{ value: "Epoch", position: "insideBottom", offset: -5, fontSize: 10, fill: "#64748b" }} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0b0f19", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                      <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#f43f5e" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: LOGS */}
      {activeTab === "Logs" && (
        <div className="p-6 rounded-2xl bg-[#0b0f19] border border-white/10 font-mono text-xs text-slate-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-violet-400" />
              Execution Logs Terminal
            </span>
            <span>Real timestamped output</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed overflow-x-auto text-emerald-400/90">
            {exp.logs || "No logs recorded."}
          </pre>
        </div>
      )}

      {/* TAB: ARTIFACTS */}
      {activeTab === "Artifacts" && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Exported Model Artifacts</h3>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-xs">
                  {exp.framework === "pytorch" ? "PT" : "SKL"}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Native Model Artifact</div>
                  <div className="text-[11px] text-slate-400 font-mono">{exp.artifact_path || "model.pt"}</div>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-medium">Validated</span>
            </div>

            {exp.framework === "pytorch" && (
              <div className="p-4 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    ONNX
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Exported ONNX Model</div>
                    <div className="text-[11px] text-slate-400 font-mono">Dynamic Batching Enabled (opset 17)</div>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium">Validated</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: CONFIGURATION */}
      {activeTab === "Configuration" && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Pipeline Preprocessing & Hyperparameters</h3>
          <pre className="p-4 rounded-xl bg-slate-900 text-xs font-mono text-slate-300 overflow-x-auto">
            {JSON.stringify({ preprocessing: exp.preprocessing, hyperparameters: exp.hyperparameters }, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB: OVERVIEW */}
      {activeTab === "Overview" && (
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-4 text-xs text-slate-300">
          <h3 className="text-sm font-bold text-white">Summary</h3>
          <p>
            Experiment <strong className="text-white">{exp.name}</strong> was executed with the <strong className="text-white">{exp.framework}</strong> framework targeting the <strong className="text-white">{exp.task_type}</strong> task.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
              <span className="text-slate-500 block">Created</span>
              <span className="font-semibold text-white">{new Date(exp.created_at).toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
              <span className="text-slate-500 block">Duration</span>
              <span className="font-semibold text-white">{exp.training_duration_sec} seconds</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
              <span className="text-slate-500 block">Architecture</span>
              <span className="font-semibold text-white">{exp.model_type}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5">
              <span className="text-slate-500 block">Status</span>
              <span className="font-semibold text-emerald-400">{exp.status}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperimentDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading experiment...</div>}>
      <ExperimentContent />
    </Suspense>
  );
}
