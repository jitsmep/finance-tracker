"use client"

import { useState } from "react"
import { Plus, Calendar, DollarSign, StickyNote, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFinance, type Transaction } from "@/components/FinanceProvider"
import { cn } from "@/lib/utils"

interface TransactionFormProps {
  /** Pass an existing transaction to edit it; omit to create new. */
  transaction?: Transaction
  /** Custom trigger element; defaults to an "Add Transaction" button. */
  trigger?: React.ReactNode
}

export function TransactionForm({ transaction, trigger }: TransactionFormProps) {
  const { categories, addTransaction, updateTransaction } = useFinance()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">(
    (transaction?.type as "income" | "expense") ?? "expense"
  )
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const todayStr = new Date().toISOString().split("T")[0]
  const dateValue = transaction?.date
    ? new Date(transaction.date).toISOString().split("T")[0]
    : todayStr

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    const amountRaw = fd.get("amount") as string
    const date      = fd.get("date") as string
    const note      = (fd.get("note") as string) ?? ""

    const newErrors: Record<string, string> = {}
    if (!amountRaw || Number(amountRaw) <= 0) newErrors.amount = "Amount must be greater than 0"
    if (!categoryId) newErrors.categoryId = "Please select a category"
    if (!date) newErrors.date = "Please select a date"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const txData = {
      type,
      amount: parseFloat(amountRaw),
      date,
      note,
      categoryId,
    }

    if (transaction) {
      updateTransaction(transaction.id, txData)
    } else {
      addTransaction(txData)
    }

    setOpen(false)
    setErrors({})
    // Reset form state
    setType("expense")
    setCategoryId("")
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (val) {
      setType((transaction?.type as "income" | "expense") ?? "expense")
      setCategoryId(transaction?.categoryId ?? "")
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button id="add-transaction-btn" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" id="transaction-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Type Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border p-1 gap-1">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                type === "expense"
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                type === "income"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2 text-sm">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              Amount
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              defaultValue={transaction?.amount}
              className="text-lg font-semibold"
              required
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              Category
            </Label>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories yet.{" "}
                <a href="/categories" className="underline text-primary">
                  Add some first →
                </a>
              </p>
            ) : (
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setErrors(prev => ({ ...prev, categoryId: "" })) }}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId}</p>}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Date
            </Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={dateValue}
              max={todayStr}
              required
            />
            {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note" className="flex items-center gap-2 text-sm">
              <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="note"
              name="note"
              placeholder="What was this for?"
              defaultValue={transaction?.note ?? ""}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={categories.length === 0}>
              {transaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
