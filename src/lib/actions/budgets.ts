"use server"

import { prisma } from "@/lib/prisma"
import { budgetSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function getBudgets(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const budgets = await prisma.budget.findMany({
    where: { month: m, year: y },
    include: { category: true },
  })

  // Calculate spent amounts for each budget
  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          categoryId: budget.categoryId,
          type: "expense",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      })

      return {
        ...budget,
        spent: spent._sum.amount ?? 0,
        percentage: Math.min(
          100,
          Math.round(((spent._sum.amount ?? 0) / budget.limit) * 100)
        ),
      }
    })
  )

  return budgetsWithSpent
}

export async function upsertBudget(data: FormData) {
  const raw = {
    limit: data.get("limit"),
    categoryId: data.get("categoryId"),
    month: data.get("month"),
    year: data.get("year"),
  }

  const parsed = budgetSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await prisma.budget.upsert({
    where: {
      categoryId_month_year: {
        categoryId: parsed.data.categoryId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: { limit: parsed.data.limit },
    create: parsed.data,
  })

  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteBudget(id: string) {
  await prisma.budget.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}
