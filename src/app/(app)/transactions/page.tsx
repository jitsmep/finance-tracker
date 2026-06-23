"use client"

import { useMemo, useState } from "react"
import { useFinance } from "@/components/FinanceProvider"
import { TransactionForm } from "@/components/transaction-form"
import { TransactionRow } from "@/components/transaction-row"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { formatCurrency, type CurrencyCode } from "@/lib/utils"

// ── Filters ───────────────────────────────────────────────────────────────────
interface Filters {
  type: string
  categoryId: string
  startDate: string
  endDate: string
}

const EMPTY_FILTERS: Filters = { type: "all", categoryId: "all", startDate: "", endDate: "" }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, categories, currency } = useFinance()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)

  const currencyCode = currency as CurrencyCode

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  )

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters.type !== "all" && tx.type !== filters.type) return false
      if (filters.categoryId !== "all" && tx.categoryId !== filters.categoryId) return false
      if (filters.startDate && tx.date < filters.startDate) return false
      if (filters.endDate   && tx.date > filters.endDate)   return false
      return true
    })
  }, [transactions, filters])

  const totalIncome   = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  function setFilter(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }
  function clearFilters() { setFilters(EMPTY_FILTERS) }
  const hasFilters = filters.type !== "all" || filters.categoryId !== "all" || !!filters.startDate || !!filters.endDate

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Transactions</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <TransactionForm />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-lg font-bold text-emerald-500">
              {formatCurrency(totalIncome, currencyCode)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Expenses</p>
            <p className="text-lg font-bold text-destructive">
              {formatCurrency(totalExpenses, currencyCode)}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-5 pb-5">
            <p className="text-xs text-muted-foreground mb-1">Net</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {formatCurrency(totalIncome - totalExpenses, currencyCode)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filters.type} onValueChange={(v) => setFilter("type", v)}>
          <SelectTrigger className="w-36" id="type-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.categoryId} onValueChange={(v) => setFilter("categoryId", v)}>
          <SelectTrigger className="w-44" id="category-filter">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-40"
          value={filters.startDate}
          onChange={(e) => setFilter("startDate", e.target.value)}
          id="start-date-filter"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <Input
          type="date"
          className="w-40"
          value={filters.endDate}
          onChange={(e) => setFilter("endDate", e.target.value)}
          id="end-date-filter"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground"
            id="clear-filters-btn"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {transactions.length === 0
                  ? "Add your first transaction above"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            filtered.map((tx) => (
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
