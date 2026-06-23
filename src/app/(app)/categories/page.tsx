"use client"

import { useState } from "react"
import { useFinance, type Category } from "@/components/FinanceProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Trash2, Pencil } from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────────
const COMMON_EMOJIS = [
  "🏠","🍕","🚗","🎬","⚡","💊","🛍️","📚","💰","💻",
  "📈","📌","✈️","🎵","🏋️","🐾","🎁","🍺","☕","🏖️",
  "🛒","🍔","🚕","💳","🎓","🏥","🎯","🌐","🎁","🔑",
]

const QUICK_PICKS = [
  { name: "Groceries",        icon: "🛒" },
  { name: "Petrol & Transit", icon: "🚗" },
  { name: "Rent / EMI",       icon: "🏠" },
  { name: "SIP & Invest",     icon: "📈" },
  { name: "Utilities",        icon: "⚡" },
  { name: "Dining Out",       icon: "🍔" },
  { name: "Health",           icon: "💊" },
  { name: "Salary",           icon: "💰" },
  { name: "Entertainment",    icon: "🎬" },
  { name: "Travel",           icon: "✈️" },
]

// ── Emoji Picker ──────────────────────────────────────────────────────────────
function EmojiPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Icon</Label>
      <div className="grid grid-cols-10 gap-1.5">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
              value === emoji
                ? "bg-primary/20 ring-2 ring-primary"
                : "hover:bg-secondary"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      <Input
        placeholder="Or type your own emoji"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24"
        maxLength={4}
      />
    </div>
  )
}

// ── Add Category Dialog ───────────────────────────────────────────────────────
function AddCategoryDialog() {
  const { addCategory } = useFinance()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("📌")
  const [error, setError] = useState("")

  function reset() {
    setName("")
    setIcon("📌")
    setError("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = addCategory({ name: name.trim(), icon })
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
      reset()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (val) reset() }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>

        {/* Quick Picks */}
        <div className="mt-2 space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Quick Picks
          </Label>
          <div className="flex flex-wrap gap-2">
            {QUICK_PICKS.map((q) => (
              <Badge
                key={q.name}
                variant="secondary"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                onClick={() => { setIcon(q.icon); setName(q.name); setError("") }}
              >
                {q.icon} {q.name}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4 pt-4 border-t border-border">
          <EmojiPicker value={icon} onChange={setIcon} />

          <div className="space-y-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Groceries"
              value={name}
              onChange={(e) => { setName(e.target.value); setError("") }}
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Category
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Category Dialog ──────────────────────────────────────────────────────
function EditCategoryDialog({ category }: { category: Category }) {
  const { updateCategory } = useFinance()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon)
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = updateCategory(category.id, { name: name.trim(), icon })
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (val) { setName(category.name); setIcon(category.icon); setError("") }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-border mt-4">
          <EmojiPicker value={icon} onChange={setIcon} />
          <div className="space-y-2">
            <Label htmlFor={`edit-name-${category.id}`}>Category Name</Label>
            <Input
              id={`edit-name-${category.id}`}
              value={name}
              onChange={(e) => { setName(e.target.value); setError("") }}
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete Category Dialog ────────────────────────────────────────────────────
function DeleteCategoryDialog({ category }: { category: Category }) {
  const { deleteCategory } = useFinance()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  function handleDelete() {
    const result = deleteCategory(category.id)
    if (result.error) {
      setError(result.error)
    } else {
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); setError("") }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          Permanently delete <strong>{category.icon} {category.name}</strong>? Categories used by transactions cannot be deleted.
        </p>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const { categories, transactions } = useFinance()

  // Count how many transactions each category has
  const txCount = (catId: string) => transactions.filter(t => t.categoryId === catId).length

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <AddCategoryDialog />
      </div>

      <div className="grid gap-3">
        {categories.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🏷️</p>
            <p>No categories yet. Add one above!</p>
          </div>
        )}
        {categories.map((cat) => {
          const count = txCount(cat.id)
          return (
            <Card key={cat.id} className="glass-card">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {count} transaction{count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cat.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                  <EditCategoryDialog category={cat} />
                  <DeleteCategoryDialog category={cat} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
