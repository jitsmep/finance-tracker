"use client";

import { useState } from "react";
import { Download, CheckCircle2 } from "lucide-react";

export function ExportData() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/transactions");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `finance-tracker-export-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-sm font-semibold text-foreground disabled:opacity-60 transition-all active:scale-[0.98] hover:border-primary/30"
    >
      {done ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className="text-primary">Downloaded!</span>
        </>
      ) : exporting ? (
        <>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export as CSV
        </>
      )}
    </button>
  );
}
