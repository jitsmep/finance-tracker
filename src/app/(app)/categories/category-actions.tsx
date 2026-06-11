"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge" // <-- Added Badge for our recommendation pills
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createCategory, deleteCategory } from "@/lib/actions/categories"

const COMMON_EMOJIS = ["🏠", "🍕", "🚗", "🎬", "⚡", "💊", "🛍️", "📚", "💰", "💻", "📈", "📌", "✈️", "🎵", "🏋️", "🐾", "🎁", "🍺", "☕", "🏖️"]

// 1. ADDED OUR EVERYDAY RECOMMENDATIONS
const RECOMMENDED_CATEGORIES = [
  { name: "Groceries", icon: "🛒" },
  { name: "Petrol & Transit", icon: "🚗" },
  { name: "Rent / EMI", icon: "🏠" },
  { name: "SIP & Invest", icon: "📈" },
  { name: "Utilities", icon: "⚡" },
  { name: "Dining Out", icon: "🍔" },
  { name: "Health", icon: "💊" },
  { name: "Salary", icon: "💰" }
]

interface CategoryActionsProps {
  categoryId?: string
}

export function CategoryActions({ categoryId }: CategoryActionsProps) {
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  // 2. Added state to control the text input
  const [selectedEmoji, setSelectedEmoji] = useState("📌")
  const [categoryName, setCategoryName] = useState("") 
  
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [deleteError, setDeleteError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Delete mode
  if (categoryId) {
    return (
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
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
            This will permanently delete the category. Categories with transactions cannot be deleted.
          </p>
          {deleteError && (
            <p className="text-sm text-destructive mt-2">{deleteError}</p>
          )}
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteCategory(categoryId)
                  if (result?.error) {
                    setDeleteError(typeof result.error === "string" ? result.error : "Failed to delete")
                  } else {
                    setDeleteOpen(false)
                    router.refresh()
                  }
                })
              }
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Create mode
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set("icon", selectedEmoji)
    formData.set("name", categoryName) // Guarantee our controlled state is submitted

    startTransition(async () => {
      const result = await createCategory(formData)
      if (result?.error) {
        setErrors(result.error as Record<string, string[]>)
      } else {
        setOpen(false)
        setCategoryName("") // Reset for next time
        setErrors({})
        router.refresh()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
        </DialogHeader>
        
        {/* 3. NEW QUICK RECOMMENDATIONS SECTION */}
        <div className="mt-2 space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Quick Recommendations</Label>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED_CATEGORIES.map((rec) => (
              <Badge 
                key={rec.name} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                onClick={() => {
                  setSelectedEmoji(rec.icon)
                  setCategoryName(rec.name)
                }}
              >
                {rec.icon} {rec.name}
              </Badge>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg transition-all ${
                    selectedEmoji === emoji
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
              value={selectedEmoji}
              onChange={(e) => setSelectedEmoji(e.target.value)}
              className="w-24"
              maxLength={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              name="name"
              placeholder="e.g. Groceries"
              value={categoryName} // Bind to our state
              onChange={(e) => setCategoryName(e.target.value)} // Update state on typing
              required
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
