export const dynamic = "force-dynamic";

// ... your existing imports and component code continue below
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
import { getTransactionStats, getMonthlyTrends } from "@/lib/actions/transactions"
import { getCategories } from "@/lib/actions/categories"
import { getSettings } from "@/lib/actions/settings"
import { getBudgets } from "@/lib/actions/budgets"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { DashboardCharts } from "../dashboard-charts"

export default async function DashboardPage() {
  const [stats, categories, settings, trends, budgets] = await Promise.all([
    getTransactionStats(),
    getCategories(),
    getSettings(),
    getMonthlyTrends(6),
    getBudgets(),
  ])

  const currency = settings.currencyCode as CurrencyCode
  const savingsRate = stats.income > 0
    ? Math.round(((stats.income - stats.expenses) / stats.income) * 100)
    : 0

  const recentTransactions = stats.transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const categoryData = Object.entries(stats.categorySpending)
    .map(([name, data]) => ({ name, value: data.amount, icon: data.icon }))
    .sort((a, b) => b.value - a.value)

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
        <TransactionForm categories={categories} />
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
            <div className={`text-2xl font-bold ${stats.balance >= 0 ? "text-[oklch(0.696_0.17_162)]" : "text-destructive"}`}>
              {formatCurrency(stats.balance, currency)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {stats.balance >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-[oklch(0.696_0.17_162)]" />
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
              <TrendingUp className="w-4 h-4 text-[oklch(0.696_0.17_162)]" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[oklch(0.696_0.17_162)]">
              {formatCurrency(stats.income, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
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
              {formatCurrency(stats.expenses, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <DashboardCharts
        trends={trends}
        categoryData={categoryData}
        currency={currency}
      />

      {/* Budget Overview */}
      {budgets.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base">Budget Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {budgets.slice(0, 4).map((budget) => (
              <div key={budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{budget.category.icon}</span>
                    <span className="font-medium">{budget.category.name}</span>
                  </span>
                  <span className={budget.percentage >= 100 ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.limit, currency)}
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full animate-progress-fill transition-all ${
                      budget.percentage >= 100
                        ? "bg-destructive"
                        : budget.percentage >= 80
                        ? "bg-[oklch(0.795_0.184_86)]"
                        : "bg-primary"
                    }`}
                    style={{ width: `${budget.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                categories={categories}
                currencyCode={currency}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
