import { getTransactions } from "@/lib/actions/transactions"
import { getCategories } from "@/lib/actions/categories"
import { getSettings } from "@/lib/actions/settings"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionRow } from "@/components/transaction-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"
import { TransactionFilters } from "./transaction-filters"

interface Props {
  searchParams: Promise<{
    type?: string
    categoryId?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function TransactionsPage({ searchParams }: Props) {
  const params = await searchParams
  const [transactions, categories, settings] = await Promise.all([
    getTransactions(params),
    getCategories(),
    getSettings(),
  ])

  const currency = settings.currencyCode as CurrencyCode
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Transactions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <TransactionForm categories={categories} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-lg font-bold text-[oklch(0.696_0.17_162)]">
              {formatCurrency(totalIncome, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Net</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? "text-[oklch(0.696_0.17_162)]" : "text-destructive"}`}>
              {formatCurrency(totalIncome - totalExpenses, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <TransactionFilters categories={categories} currentFilters={params} />

      {/* List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your filters or add a new transaction
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
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
