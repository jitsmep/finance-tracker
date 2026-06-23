"use client"

import { useMemo } from "react"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionRow } from "@/components/transaction-row"
import { useFinance } from "@/components/FinanceProvider"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { DashboardCharts } from "../dashboard-charts"

export default function DashboardPage() {
  const { transactions, categories, currency } = useFinance()
  const currencyCode = currency as CurrencyCode

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  // All-time stats
  const income   = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const balance  = income - expenses
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0

  // Last 5 transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  // Category spending breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; icon: string; value: number }> = {}
    transactions
      .filter(t => t.type === "expense")
      .forEach(t => {
        const cat = categoryMap[t.categoryId]
        const key = cat?.name ?? "Other"
        if (!map[key]) map[key] = { name: key, icon: cat?.icon ?? "❓", value: 0 }
        map[key].value += t.amount
      })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [transactions, categoryMap])

  // Monthly trends (last 6 months)
  const trends = useMemo(() => {
    const results = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const monthTxs = transactions.filter(t => t.date.startsWith(monthStr))
      const inc = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const exp = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      results.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        income: inc,
        expenses: exp,
        savings: inc - exp,
      })
    }
    return results
  }, [transactions])

  const now = new Date()
  const monthName = now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const hour = now.getHours()
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
    hour < 21 ? "Good evening" : "Good night"
  const greetingEmoji =
    hour < 12 ? "☀️" :
    hour < 17 ? "🌤️" :
    hour < 21 ? "🌆" : "🌙"

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{greetingEmoji} {greeting}!</p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">Overview</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{monthName}</p>
        </div>
        <TransactionForm />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Balance */}
        <Card className="glass-card relative overflow-hidden stagger-1 animate-slide-up">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {formatCurrency(balance, currencyCode)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {balance >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">
                {savingsRate}% savings rate
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Income */}
        <Card className="glass-card stagger-2 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(income, currencyCode)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="glass-card stagger-3 animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(expenses, currencyCode)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <DashboardCharts
        trends={trends}
        categoryData={categoryData}
        currency={currencyCode}
      />

      {/* Recent Transactions */}
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <a href="/transactions" className="text-xs text-primary hover:underline">
            View all
          </a>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No transactions yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Add your first transaction above!</p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                category={categoryMap[tx.categoryId]}
                currencyCode={currencyCode}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
