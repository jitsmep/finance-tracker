"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Tag,
  Settings,
  TrendingUp,
  Wallet,
  Briefcase,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard, emoji: "📊" },
  { href: "/transactions",  label: "Transactions", icon: ArrowLeftRight,  emoji: "💸" },
  { href: "/budgets",       label: "Budgets",      icon: PieChart,        emoji: "🎯" },
  { href: "/portfolio",     label: "Portfolio",    icon: Briefcase,       emoji: "📈" },
  { href: "/analytics",     label: "Analytics",    icon: TrendingUp,      emoji: "🔥" },
  { href: "/categories",    label: "Categories",   icon: Tag,             emoji: "🏷️" },
  { href: "/settings",      label: "Settings",     icon: Settings,        emoji: "⚙️" },
]

// Only show 5 items in mobile bottom nav (most important)
const MOBILE_NAV = NAV_ITEMS.filter((i) =>
  ["/dashboard", "/transactions", "/budgets", "/analytics", "/settings"].includes(i.href)
)

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* ══════════════════════════════════════════════
          DESKTOP SIDEBAR (Hidden on Mobile)
      ══════════════════════════════════════════════ */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 z-30">

        {/* Logo */}
        <div className="px-5 pt-6 pb-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/15 shadow-md shadow-primary/20 animate-pulse-glow">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight">
                Finance Tracker
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Personal Finance</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {/* Main nav items */}
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Main
          </p>
          {NAV_ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-foreground/60" />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", active ? "" : "group-hover:scale-110")} />
                {label}
              </Link>
            )
          })}

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-sidebar-border/60" />
          </div>

          <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
            Manage
          </p>
          {NAV_ITEMS.slice(5).map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-foreground/60" />
                )}
                <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-200", active ? "" : "group-hover:scale-110")} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] text-muted-foreground">© 2025 Finance Tracker</p>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
      ══════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-2xl border-t border-border shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around px-2 pt-2 pb-safe">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 min-w-[56px] py-1.5 px-2 rounded-2xl transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* Active background pill */}
                {active && (
                  <span className="absolute inset-0 rounded-2xl bg-primary/10 scale-90" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-200",
                    active ? "scale-110" : "scale-100"
                  )}
                />
                <span className={cn(
                  "text-[10px] font-semibold relative z-10 leading-none",
                  active ? "text-primary" : "text-muted-foreground/80"
                )}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
