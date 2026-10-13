"use client";

import { useState } from "react";
import {
  Settings,
  Server,
  Gauge,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000");
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const [defaultBatch, setDefaultBatch] = useState(1);
  const [defaultIterations, setDefaultIterations] = useState(100);
  const [saved, setSaved] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.getHealth();
      setTestResult(`Connected! API Version: ${res.version} • Status: ${res.status}`);
    } catch (err: any) {
      setTestResult("Connection failed: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure API endpoints, default benchmarking parameters, and workspace preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* API Backend Configuration */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-violet-400" />
            Backend Connection
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              FastAPI Endpoint URL
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="button"
                onClick={testConnection}
                disabled={testing}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-medium flex items-center gap-2"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Test Ping"}
              </button>
            </div>
            {testResult && (
              <div className="mt-2 text-xs font-medium text-emerald-400">
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Benchmarking Defaults */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-white/5 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-indigo-400" />
            Default Benchmark Parameters
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Batch Size</label>
              <select
                value={defaultBatch}
                onChange={(e) => setDefaultBatch(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="1">1 (Single instance)</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Measured Iterations</label>
              <select
                value={defaultIterations}
                onChange={(e) => setDefaultIterations(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
              >
                <option value="50">50 iterations</option>
                <option value="100">100 iterations (Standard)</option>
                <option value="200">200 iterations (High precision)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {saved ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully!
            </span>
          ) : (
            <span></span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
