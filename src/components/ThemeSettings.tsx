"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-24 animate-pulse bg-slate-100 rounded-xl" />; 

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm max-w-xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Customize how your finance dashboard looks on this device.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* System OS Option */}
        <button
          onClick={() => setTheme("system")}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
            theme === "system" 
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <span className="text-2xl mb-2">💻</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">System OS</span>
        </button>

        {/* Light Mode Option */}
        <button
          onClick={() => setTheme("light")}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
            theme === "light" 
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <span className="text-2xl mb-2">☀️</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Light</span>
        </button>

        {/* Dark Mode Option */}
        <button
          onClick={() => setTheme("dark")}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
            theme === "dark" 
              ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <span className="text-2xl mb-2">🌙</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dark</span>
        </button>
      </div>
    </div>
  );
}
