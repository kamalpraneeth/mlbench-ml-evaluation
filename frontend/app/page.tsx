"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Cpu,
  Layers,
  Gauge,
  Workflow,
  CheckCircle2,
  Terminal,
  ShieldCheck,
  FileText,
  Boxes,
  Database,
  GitBranch,
} from "lucide-react";

export default function LandingPage() {
  const workflowSteps = [
    { title: "Dataset", desc: "Safe CSV ingestion & profiling", icon: Database },
    { title: "Preprocessing", desc: "Leak-free feature encoding", icon: Layers },
    { title: "Training", desc: "PyTorch & Scikit-learn", icon: Cpu },
    { title: "Export", desc: "ONNX graph validation", icon: Boxes },
    { title: "Benchmark", desc: "Monotonic P95 latency", icon: Gauge },
    { title: "Report", desc: "Traceable JSON/CSV logs", icon: FileText },
  ];

  const features = [
    {
      title: "Model Training",
      desc: "Train genuine PyTorch MLPs and Scikit-learn baselines on real datasets with reproducible random seeds and held-out validation.",
      icon: Cpu,
      tag: "PyTorch & Scikit-learn",
    },
    {
      title: "Cross-Framework Inference",
      desc: "Export PyTorch checkpoints to ONNX with dynamic batching. Verify numerical consistency between native and ONNX Runtime.",
      icon: Boxes,
      tag: "ONNX Runtime & TFLite",
    },
    {
      title: "Benchmarking Engine",
      desc: "High-resolution monotonic timer measures cold-start, warmup, mean, median, P95, throughput (sps), and peak memory usage.",
      icon: Gauge,
      tag: "Monotonic Nanosecond Precision",
    },
    {
      title: "CI/CD & Automation",
      desc: "Comprehensive GitHub Actions workflow, production Jenkinsfile, and Apache Airflow DAGs for automated regression checks.",
      icon: Workflow,
      tag: "GitHub Actions & Airflow",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-violet-500/30">
      {/* Top Navigation */}
      <header className="h-20 border-b border-white/5 px-8 max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">MLBench</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#workflow" className="hover:text-white transition-colors">How It Works</a>
          <a href="#tech-stack" className="hover:text-white transition-colors">Tech Stack</a>
          <Link href="/system" className="hover:text-white transition-colors">System Health</Link>
          <a href="https://github.com" target="_blank" className="hover:text-white transition-colors">GitHub</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Open Source • Production Ready Engineering Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Train. Compare. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-purple-400">
            Benchmark. Optimize.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          A complete, full-stack machine learning engineering platform to train, evaluate, deploy,
          and benchmark models across PyTorch, ONNX Runtime, and TensorFlow Lite.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-base shadow-xl shadow-violet-600/30 transition-all flex items-center gap-2.5"
          >
            Open Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            className="px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-base transition-colors"
          >
            View GitHub
          </a>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="w-full rounded-2xl p-2 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 shadow-2xl">
          <div className="rounded-xl bg-[#0b0f19] border border-white/5 overflow-hidden p-6 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-3 text-xs text-slate-400 font-mono">mlbench.engine/dashboard</span>
              </div>
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Inference Runtimes Active
              </span>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="text-xs text-slate-400 mb-1">Total Experiments</div>
                <div className="text-2xl font-bold text-white">24</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">↑ 12% vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="text-xs text-slate-400 mb-1">Models Registered</div>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">↑ 33% vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="text-xs text-slate-400 mb-1">Benchmark Runs</div>
                <div className="text-2xl font-bold text-white">36</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">↑ 28% vs last month</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/60 border border-white/5">
                <div className="text-xs text-slate-400 mb-1">Avg Inference Latency</div>
                <div className="text-2xl font-bold text-violet-400">0.05 ms</div>
                <div className="text-[11px] text-emerald-400 font-medium mt-1">↓ 24% faster latency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Core Platform Capabilities</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
            Engineered from ground up for reproducible machine learning evaluation and high-performance benchmarking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-8 rounded-2xl bg-[#0f172a]/70 border border-white/5 hover:border-violet-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-3 inline-block">
                    {f.tag}
                  </span>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow Diagram */}
      <section id="workflow" className="py-20 px-6 border-t border-b border-white/5 bg-[#0b0f19]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">End-to-End Pipeline Workflow</h2>
            <p className="text-slate-400 text-sm md:text-base">
              From raw dataset ingestion to rigorous cross-runtime benchmark reports.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {workflowSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-3 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <Icon className="w-5 h-5 text-indigo-400 mb-2" />
                  <div className="text-sm font-semibold text-white mb-1">{step.title}</div>
                  <div className="text-[11px] text-slate-400">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack" className="py-20 px-6 max-w-6xl mx-auto w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-8">Production Technology Stack</h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {[
            "FastAPI",
            "PyTorch 2.11",
            "ONNX 1.23",
            "ONNX Runtime 1.31",
            "Scikit-learn 1.6",
            "Next.js 16",
            "React 19",
            "Tailwind CSS",
            "SQLAlchemy",
            "Docker",
            "GitHub Actions",
            "Apache Airflow",
          ].map((tech) => (
            <span
              key={tech}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-10 px-8 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            © 2026 MLBench Platform. Built for Senior Machine Learning Engineering.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-slate-300">Dashboard</Link>
            <Link href="/benchmarks" className="hover:text-slate-300">Benchmark Lab</Link>
            <Link href="/system" className="hover:text-slate-300">System Health</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
