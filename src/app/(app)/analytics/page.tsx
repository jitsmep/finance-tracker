"use client"

import { useMemo } from "react"
import { useFinance } from "@/components/FinanceProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { AnalyticsCharts } from "./analytics-charts"

export default function AnalyticsPage() {
  const { transactions, categories, currency: currencyState } = useFinance()
  const currency = currencyState as CurrencyCode

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

  const stats = useMemo(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const currentMonthTxs = transactions.filter(t => t.date.startsWith(monthStr))

    const expenses = currentMonthTxs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const categoryMap = currentMonthTxs
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const cat = categories.find((c) => c.id === t.categoryId)
        const name = cat?.name || "Uncategorized"
        const icon = cat?.icon || "❓"
        acc[name] = acc[name] || { name, icon, amount: 0 }
        acc[name].amount += t.amount
        return acc
      }, {} as Record<string, { name: string; icon: string; amount: number }>)

    return {
      expenses,
      categorySpending: categoryMap,
    }
  }, [transactions, categories])

  const categoryData = useMemo(() => {
    return Object.entries(stats.categorySpending)
      .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
      .sort((a, b) => b.value - a.value)
  }, [stats.categorySpending])

  const avgIncome = useMemo(() => trends.length
    ? trends.reduce((s, t) => s + t.income, 0) / trends.length
    : 0, [trends])
  const avgExpenses = useMemo(() => trends.length
    ? trends.reduce((s, t) => s + t.expenses, 0) / trends.length
    : 0, [trends])
  const avgSavings = avgIncome - avgExpenses
  const savingsRate = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 100) : 0

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Analytics</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">6-month financial overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg. Monthly Income", value: formatCurrency(avgIncome, currency), color: "text-[oklch(0.696_0.17_162)]" },
          { label: "Avg. Monthly Expenses", value: formatCurrency(avgExpenses, currency), color: "text-destructive" },
          { label: "Avg. Monthly Savings", value: formatCurrency(avgSavings, currency), color: avgSavings >= 0 ? "text-[oklch(0.696_0.17_162)]" : "text-destructive" },
          { label: "Savings Rate", value: `${savingsRate}%`, color: savingsRate >= 20 ? "text-[oklch(0.696_0.17_162)]" : savingsRate >= 10 ? "text-[oklch(0.795_0.184_86)]" : "text-destructive" },
        ].map((item) => (
          <Card key={item.label} className="glass-card">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-lg font-bold mt-1 ${item.color}`}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsCharts trends={trends} categoryData={categoryData} currency={currency} />

      {/* Top Spending Categories */}
      {categoryData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Top Spending Categories (This Month)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryData.slice(0, 6).map((cat, i) => {
              const pct = stats.expenses > 0 ? Math.round((cat.value / stats.expenses) * 100) : 0
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-base">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <span className="text-sm text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-primary animate-progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold w-24 text-right">
                    {formatCurrency(cat.value, currency)}
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
