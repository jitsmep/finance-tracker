"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, Calendar, DollarSign, StickyNote, Tag } from "lucide-react"
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
import { createTransaction, updateTransaction } from "@/lib/actions/transactions"
import { cn } from "@/lib/utils"

type Category = { id: string; name: string; icon: string }
type Transaction = {
  id: string
  type: string
  amount: number
  date: Date | string
  note: string | null
  categoryId: string
}

interface TransactionFormProps {
  categories: Category[]
  transaction?: Transaction
  trigger?: React.ReactNode
}

export function TransactionForm({ categories, transaction, trigger }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"income" | "expense">(
    (transaction?.type as "income" | "expense") ?? "expense"
  )
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const dateValue = transaction?.date
    ? new Date(transaction.date).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    formData.set("categoryId", categoryId)

    startTransition(async () => {
      const result = transaction
        ? await updateTransaction(transaction.id, formData)
        : await createTransaction(formData)

      if (result?.error) {
        setErrors(result.error as Record<string, string[]>)
      } else {
        setOpen(false)
        setErrors({})
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
                  ? "bg-[oklch(0.696_0.17_162)] text-[oklch(0.145_0_0)] shadow-sm"
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
              min="0"
              placeholder="0.00"
              defaultValue={transaction?.amount}
              className="text-lg font-semibold"
              required
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount[0]}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
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
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId[0]}</p>
            )}
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
              required
            />
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
            <Button type="submit" className="flex-1" disabled={isPending || !categoryId}>
              {isPending ? "Saving..." : transaction ? "Save Changes" : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
