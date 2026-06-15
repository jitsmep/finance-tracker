"use client";

import { useState, useTransition } from "react";
import { updateNavLayout } from "@/lib/actions/settings";
import { LayoutPanelLeft, LayoutPanelTop, PanelBottom, Check } from "lucide-react";

const LAYOUT_OPTIONS = [
  {
    key: "sidebar",
    label: "Sidebar",
    desc: "Left navigation",
    icon: LayoutPanelLeft,
  },
  {
    key: "top",
    label: "Top Bar",
    desc: "Header navigation",
    icon: LayoutPanelTop,
  },
  {
    key: "bottom",
    label: "Bottom Bar",
    desc: "Floating navigation",
    icon: PanelBottom,
  },
] as const;

export function NavLayoutSettings({ initialLayout }: { initialLayout: string }) {
  const [layout, setLayout] = useState(initialLayout);
  const [isPending, startTransition] = useTransition();

  function handleLayoutChange(newLayout: string) {
    setLayout(newLayout);
    startTransition(async () => {
      await updateNavLayout(newLayout);
    });
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {LAYOUT_OPTIONS.map(({ key, label, desc, icon: Icon }) => {
            const active = layout === key;
            return (
              <button
                key={key}
                onClick={() => handleLayoutChange(key)}
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
                <Icon className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-center">
                  <p className={`text-xs font-bold ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
