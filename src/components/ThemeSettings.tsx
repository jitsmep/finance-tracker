"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Sun, Moon, Check } from "lucide-react";

const THEME_OPTIONS = [
  {
    key: "system",
    label: "System",
    desc: "Match OS",
    icon: Monitor,
    emoji: "💻",
  },
  {
    key: "light",
    label: "Light",
    desc: "Always light",
    icon: Sun,
    emoji: "☀️",
  },
  {
    key: "dark",
    label: "Dark",
    desc: "Always dark",
    icon: Moon,
    emoji: "🌙",
  },
] as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-[100px] rounded-2xl bg-secondary/30 animate-pulse" />;
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ key, label, desc, emoji }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "border-primary bg-primary/10 shadow-md shadow-primary/15"
                    : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60"
                }`}
              >
                {active && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <span className="text-2xl">{emoji}</span>
                <div className="text-center">
                  <p className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/40 border border-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-xs text-muted-foreground">
            Currently using <span className="font-semibold text-foreground capitalize">{theme}</span> theme
          </p>
        </div>
      </div>
    </div>
  );
}
