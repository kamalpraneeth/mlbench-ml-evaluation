"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Play,
  Gauge,
  Clock,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

function ModelDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [model, setModel] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Playground state
  const [selectedRuntime, setSelectedRuntime] = useState("native");
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([api.getModel(id), api.getModelMetadata(id)])
        .then(([m, mMeta]) => {
          setModel(m);
          setMeta(mMeta);

          // Initialize input values with default 1.0
          const initialInputs: Record<string, any> = {};
          (mMeta.input_features || []).forEach((feat: string) => {
            initialInputs[feat] = 1.0;
          });
          setInputValues(initialInputs);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  const handlePredict = async () => {
    setPredicting(true);
    try {
      const res = await api.predictModel(id, [inputValues], selectedRuntime);
      setPredictResult(res);
    } catch (err: any) {
      alert("Prediction failed: " + err.message);
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block mb-3"></span>
        <div>Loading model specifications...</div>
      </div>
    );
  }

  if (!model) {
    return <div className="p-12 text-center text-red-400">Model not found.</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/models" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Model Registry
          </Link>
          <span>/</span>
          <span className="text-slate-300 font-mono">{model.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{model.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Version: <span className="font-mono text-indigo-300">{model.version}</span> • Framework: <span className="text-indigo-400 capitalize">{model.framework}</span> • Dataset: {model.dataset_name}
            </p>
          </div>

          <Link
            href="/benchmarks"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 w-fit"
          >
            <Gauge className="w-3.5 h-3.5" />
            Benchmark in Lab
          </Link>
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5">
          <div className="text-xs text-slate-400 mb-1">Validation Status</div>
          <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {model.validation_status}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5">
          <div className="text-xs text-slate-400 mb-1">Supported Formats</div>
          <div className="text-sm font-bold text-white">
            {(model.formats || []).join(", ").toUpperCase()}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5">
          <div className="text-xs text-slate-400 mb-1">Artifact Size</div>
          <div className="text-base font-bold text-white font-mono">
            {(model.artifact_size_bytes / 1024).toFixed(1)} KB
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#0f172a] border border-white/5">
          <div className="text-xs text-slate-400 mb-1">Input Feature Count</div>
          <div className="text-base font-bold text-indigo-400">
            {meta?.input_features?.length || 0} features
          </div>
        </div>
      </div>

      {/* Interactive Inference Playground */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Live Inference Playground
            </h2>
            <p className="text-xs text-slate-400">
              Pass test features to execute genuine model predictions across target runtimes.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Target Runtime:</span>
            <select
              value={selectedRuntime}
              onChange={(e) => setSelectedRuntime(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-medium"
            >
              <option value="native">{model.framework === "pytorch" ? "PyTorch Native" : "Scikit-learn Native"}</option>
              {model.formats?.includes("onnx") && <option value="onnx">ONNX Runtime (Optimized)</option>}
            </select>
          </div>
        </div>

        {/* Feature Input Inputs */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-3">Model Feature Inputs:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2 bg-slate-900/60 rounded-xl border border-white/5">
            {(meta?.input_features || []).slice(0, 16).map((feat: string) => (
              <div key={feat}>
                <span className="block text-[11px] font-mono text-slate-400 truncate mb-1" title={feat}>
                  {feat}
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={inputValues[feat] ?? 1.0}
                  onChange={(e) =>
                    setInputValues({
                      ...inputValues,
                      [feat]: parseFloat(e.target.value) || 0.0,
                    })
                  }
                  className="w-full bg-slate-800 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handlePredict}
          disabled={predicting}
          className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {predicting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Executing Prediction...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              Run Inference
            </>
          )}
        </button>

        {/* Prediction Results Banner */}
        {predictResult && (
          <div className="p-5 rounded-xl bg-slate-900 border border-violet-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
              <span className="text-slate-400">Runtime Used: <strong className="text-white">{predictResult.runtime_used}</strong></span>
              <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Latency: {predictResult.latency_ms} ms
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Model Output:</span>
              <div className="text-lg font-bold text-white font-mono bg-[#0b0f19] p-3 rounded-lg border border-white/5">
                {JSON.stringify(predictResult.predictions)}
              </div>
            </div>

            {predictResult.probabilities && (
              <div>
                <span className="text-xs text-slate-400 block mb-1">Class Probabilities:</span>
                <pre className="text-xs text-slate-300 font-mono bg-[#0b0f19] p-3 rounded-lg border border-white/5 overflow-x-auto">
                  {JSON.stringify(predictResult.probabilities[0], null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModelDetailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading model...</div>}>
      <ModelDetailContent />
    </Suspense>
  );
}
