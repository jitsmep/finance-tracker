"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch in Next 15
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />; 

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 text-xl rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:scale-105 transition-all"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
