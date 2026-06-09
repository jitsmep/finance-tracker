import { getMonthlyTrends, getTransactionStats } from "@/lib/actions/transactions"
import { getSettings } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { AnalyticsCharts } from "./analytics-charts"

export default async function AnalyticsPage() {
  const [trends, stats, settings] = await Promise.all([
    getMonthlyTrends(6),
    getTransactionStats(),
    getSettings(),
  ])

  const currency = settings.currencyCode as CurrencyCode

  const categoryData = Object.entries(stats.categorySpending)
    .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
    .sort((a, b) => b.value - a.value)

  const avgIncome = trends.length
    ? trends.reduce((s, t) => s + t.income, 0) / trends.length
    : 0
  const avgExpenses = trends.length
    ? trends.reduce((s, t) => s + t.expenses, 0) / trends.length
    : 0
  const avgSavings = avgIncome - avgExpenses
  const savingsRate = avgIncome > 0 ? Math.round((avgSavings / avgIncome) * 100) : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-1">6-month financial overview</p>
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
