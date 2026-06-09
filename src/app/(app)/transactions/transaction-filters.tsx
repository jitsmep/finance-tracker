"use client"

import { useRouter, usePathname } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Category = { id: string; name: string; icon: string }

interface TransactionFiltersProps {
  categories: Category[]
  currentFilters: {
    type?: string
    categoryId?: string
    startDate?: string
    endDate?: string
  }
}

export function TransactionFilters({ categories, currentFilters }: TransactionFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams()
    const merged = { ...currentFilters, [key]: value }
    Object.entries(merged).forEach(([k, v]) => {
      if (v && v !== "all") params.set(k, v)
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  function clearFilters() {
    router.push(pathname)
  }

  const hasFilters = Object.values(currentFilters).some(Boolean)

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Type filter */}
      <Select
        value={currentFilters.type ?? "all"}
        onValueChange={(v) => updateFilter("type", v)}
      >
        <SelectTrigger className="w-36" id="type-filter">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="income">Income</SelectItem>
          <SelectItem value="expense">Expense</SelectItem>
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select
        value={currentFilters.categoryId ?? "all"}
        onValueChange={(v) => updateFilter("categoryId", v)}
      >
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

      {/* Date range */}
      <Input
        type="date"
        className="w-40"
        value={currentFilters.startDate ?? ""}
        onChange={(e) => updateFilter("startDate", e.target.value)}
        id="start-date-filter"
      />
      <span className="text-muted-foreground text-sm">to</span>
      <Input
        type="date"
        className="w-40"
        value={currentFilters.endDate ?? ""}
        onChange={(e) => updateFilter("endDate", e.target.value)}
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
  )
}
