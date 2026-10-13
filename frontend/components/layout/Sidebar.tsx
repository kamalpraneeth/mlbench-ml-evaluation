"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  GitCompare,
  Gauge,
  Database,
  FileText,
  Workflow,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Experiments", href: "/experiments", icon: FlaskConical },
  { name: "Models", href: "/models", icon: Boxes },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "Benchmark Lab", href: "/benchmarks", icon: Gauge },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Pipelines", href: "/pipelines", icon: Workflow },
  { name: "System Health", href: "/system", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  // If on public landing page `/`, do not render the sidebar
  if (pathname === "/") return null;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0b0f19] border-r border-white/5 flex flex-col min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/5 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white">MLBench</span>
          <span className="ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
            PRO
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/20 font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Status quick widget */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/60 border border-white/5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Engine Status</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          PyTorch 2.11 • ONNX Runtime 1.31
        </div>
      </div>
    </aside>
  );
}
