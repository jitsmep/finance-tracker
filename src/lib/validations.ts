import { z } from "zod"

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  note: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
})

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name is too long"),
  icon: z.string().min(1, "Icon is required").max(4, "Icon must be an emoji"),
})

export const budgetSchema = z.object({
  limit: z.coerce.number().positive("Budget limit must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
})

export const settingsSchema = z.object({
  currencyCode: z.string().min(3).max(3),
})

export type TransactionFormData = z.infer<typeof transactionSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type BudgetFormData = z.infer<typeof budgetSchema>
export type SettingsFormData = z.infer<typeof settingsSchema>
