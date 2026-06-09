"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
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
import { upsertBudget, deleteBudget } from "@/lib/actions/budgets"

type Category = { id: string; name: string; icon: string }

interface BudgetFormProps {
  categories: Category[]
  month: number
  year: number
  existingCategoryIds?: string[]
  trigger?: React.ReactNode
  editBudget?: { id: string; limit: number; categoryId: string }
}

export function BudgetForm({
  categories,
  month,
  year,
  existingCategoryIds = [],
  trigger,
  editBudget,
}: BudgetFormProps) {
  const [open, setOpen] = useState(false)
  const [categoryId, setCategoryId] = useState(editBudget?.categoryId ?? "")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const availableCategories = editBudget
    ? categories
    : categories.filter((c) => !existingCategoryIds.includes(c.id))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("categoryId", categoryId)
    formData.set("month", String(month))
    formData.set("year", String(year))

    startTransition(async () => {
      const result = await upsertBudget(formData)
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
          <Button id="add-budget-btn" className="gap-2">
            <Plus className="w-4 h-4" />
            Set Budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editBudget ? "Edit Budget" : "Set Monthly Budget"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={!!editBudget}
            >
              <SelectTrigger id="budget-category-select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-limit">Monthly Limit</Label>
            <Input
              id="budget-limit"
              name="limit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={editBudget?.limit}
              required
            />
            {errors.limit && (
              <p className="text-xs text-destructive">{errors.limit[0]}</p>
            )}
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
              {isPending ? "Saving..." : editBudget ? "Update" : "Set Budget"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteBudgetButtonProps {
  id: string
}

export function DeleteBudgetButton({ id }: DeleteBudgetButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deleteBudget(id)
          router.refresh()
        })
      }
      className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
    >
      {isPending ? "..." : "Remove"}
    </button>
  )
}
