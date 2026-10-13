import { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "MLBench — Cross-Framework Model Evaluation & Benchmarking Platform",
  description: "Train. Compare. Benchmark. Optimize. Cross-framework evaluation across PyTorch, ONNX Runtime, and TensorFlow Lite.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex antialiased">
        <Suspense fallback={<div className="w-64 bg-[#0b0f19]"></div>}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Suspense fallback={<div className="h-16 bg-[#090d16]"></div>}>
            <Header />
          </Suspense>
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-8 text-slate-400">Loading view...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </body>
    </html>
  );
}
