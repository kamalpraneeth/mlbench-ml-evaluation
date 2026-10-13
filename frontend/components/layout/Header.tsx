"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Sun, Moon, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

export function Header() {
  const pathname = usePathname();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api.getHealth()
      .then(() => setIsHealthy(true))
      .catch(() => setIsHealthy(false));
  }, []);

  // Do not show header on landing page `/`
  if (pathname === "/") return null;

  return (
    <header className="h-16 border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Global Search Bar */}
      <div className="relative w-96">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search experiments, models, datasets..."
          className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* API Server status badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-white/5">
          {isHealthy ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">API Server</span>
              <span className="text-emerald-400 font-semibold">Live</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">API Server Connecting...</span>
            </>
          )}
        </div>

        {/* Theme toggle dummy */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <Sun className="w-4 h-4 text-amber-400" />
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-violet-500 absolute top-2 right-2"></span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
            KP
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-200">Kamal Praneeth</div>
            <div className="text-slate-500">ML Engineer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
