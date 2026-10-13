"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database,
  Upload,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTask, setUploadTask] = useState("classification");
  const [uploadTarget, setUploadTarget] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.getDatasets()
      .then((data) => {
        setDatasets(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadName || !uploadTarget) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", uploadName);
    formData.append("task_type", uploadTask);
    formData.append("target_column", uploadTarget);

    try {
      const res = await fetch("http://localhost:8000/api/v1/datasets/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const newDs = await res.json();
      setDatasets([newDs, ...datasets]);
      setShowUploadModal(false);
    } catch (err: any) {
      alert("Error uploading dataset: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Datasets</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage, profile and explore your benchmark training and test datasets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 flex items-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>
      </div>

      {/* Datasets Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider font-semibold bg-slate-900/40">
              <tr>
                <th className="py-3.5 px-6">Dataset Name</th>
                <th className="py-3.5 px-4">Filename</th>
                <th className="py-3.5 px-4">Rows</th>
                <th className="py-3.5 px-4">Columns</th>
                <th className="py-3.5 px-4">Task</th>
                <th className="py-3.5 px-4">Target Column</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">
                    <Link href={`/datasets/${d.id}`} className="hover:text-violet-400 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-violet-400" />
                      {d.name}
                    </Link>
                  </td>
                  <td className="py-4 px-4 font-mono text-[11px] text-slate-400">{d.filename}</td>
                  <td className="py-4 px-4 font-mono">{d.row_count?.toLocaleString()}</td>
                  <td className="py-4 px-4 font-mono">{d.col_count}</td>
                  <td className="py-4 px-4 capitalize text-slate-300 font-medium">{d.task_type}</td>
                  <td className="py-4 px-4 font-mono text-indigo-300">{d.target_column}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link
                      href={`/datasets/${d.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 hover:text-white font-medium text-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      Explore
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Dataset Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-white">Upload New Dataset</h2>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dataset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Credit Card Fraud Analytics"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Task Type</label>
                  <select
                    value={uploadTask}
                    onChange={(e) => setUploadTask(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                  >
                    <option value="classification">Classification</option>
                    <option value="regression">Regression</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Column</label>
                  <input
                    type="text"
                    placeholder="e.g. category"
                    value={uploadTarget}
                    onChange={(e) => setUploadTarget(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/30 disabled:opacity-50"
                >
                  {uploading ? "Ingesting..." : "Upload & Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
