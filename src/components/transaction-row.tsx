"use client"

import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFinance, type Transaction, type Category } from "@/components/FinanceProvider"
import { TransactionForm } from "./transaction-form"
import { formatCurrency, formatDate, type CurrencyCode } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface TransactionRowProps {
  transaction: Transaction
  category: Category | undefined
  currencyCode: CurrencyCode
}

export function TransactionRow({ transaction, category, currencyCode }: TransactionRowProps) {
  const { deleteTransaction } = useFinance()
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleDelete() {
    deleteTransaction(transaction.id)
    setDeleteOpen(false)
  }

  const isIncome = transaction.type === "income"

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-all duration-200 group">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
        isIncome ? "bg-emerald-500/15" : "bg-destructive/10"
      )}>
        {category?.icon ?? "❓"}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {transaction.note || category?.name || "Unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{category?.name ?? "—"}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formatDate(transaction.date)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className={cn(
        "text-sm font-semibold shrink-0",
        isIncome ? "text-emerald-500" : "text-destructive"
      )}>
        {isIncome ? "+" : "−"}{formatCurrency(transaction.amount, currencyCode)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TransactionForm
          transaction={transaction}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8" id={`edit-tx-${transaction.id}`}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          }
        />

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              id={`delete-tx-${transaction.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete Transaction</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                id="confirm-delete-btn"
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
