import { getBudgets } from "@/lib/actions/budgets"
import { getCategories } from "@/lib/actions/categories"
import { getSettings } from "@/lib/actions/settings"
import { BudgetForm, DeleteBudgetButton } from "@/components/budget-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>
}

export default async function BudgetsPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1
  const year = params.year ? parseInt(params.year) : now.getFullYear()

  const [budgets, categories, settings] = await Promise.all([
    getBudgets(month, year),
    getCategories(),
    getSettings(),
  ])

  const currency = settings.currencyCode as CurrencyCode
  const existingCategoryIds = budgets.map((b) => b.categoryId)
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const overBudgetCount = budgets.filter((b) => b.percentage >= 100).length

  const monthName = new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Budgets</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{monthName}</p>
        </div>
        <BudgetForm
          categories={categories}
          month={month}
          year={year}
          existingCategoryIds={existingCategoryIds}
        />
      </div>

      {/* Summary Cards */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground">Total Budget</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {formatCurrency(totalLimit, currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className={cn("text-xl font-bold mt-1",
                totalSpent > totalLimit ? "text-destructive" : "text-foreground")}>
                {formatCurrency(totalSpent, currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className={cn("text-xl font-bold mt-1",
                totalLimit - totalSpent >= 0 ? "text-[oklch(0.696_0.17_162)]" : "text-destructive")}>
                {formatCurrency(Math.max(0, totalLimit - totalSpent), currency)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget List */}
      {budgets.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-16 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="font-medium text-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1">
              Set monthly spending limits to track your goals
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const isOver = budget.percentage >= 100
            const isWarning = budget.percentage >= 80 && !isOver
            const remaining = budget.limit - budget.spent

            return (
              <Card key={budget.id} className={cn(
                "glass-card transition-all",
                isOver && "border-destructive/30"
              )}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{budget.category.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{budget.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.limit, currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto sm:ml-0">
                      {isOver ? (
                        <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Over by</span> {formatCurrency(Math.abs(remaining), currency)}
                        </div>
                      ) : isWarning ? (
                        <div className="flex items-center gap-1.5 text-[oklch(0.795_0.184_86)] text-xs font-medium">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {formatCurrency(remaining, currency)} <span className="hidden sm:inline">left</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[oklch(0.696_0.17_162)] text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {formatCurrency(remaining, currency)} <span className="hidden sm:inline">left</span>
                        </div>
                      )}
                      <span className="text-xs font-bold text-foreground">
                        {budget.percentage}%
                      </span>
                      <DeleteBudgetButton id={budget.id} />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full animate-progress-fill transition-all",
                        isOver
                          ? "bg-destructive"
                          : isWarning
                          ? "bg-[oklch(0.795_0.184_86)]"
                          : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, budget.percentage)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
