"use server"

import { prisma } from "@/lib/prisma"
import { transactionSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function getTransactions(filters?: {
  type?: string
  categoryId?: string
  startDate?: string
  endDate?: string
}) {
  const where: Record<string, unknown> = {}

  if (filters?.type && filters.type !== "all") {
    where.type = filters.type
  }
  if (filters?.categoryId && filters.categoryId !== "all") {
    where.categoryId = filters.categoryId
  }
  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) {
      (where.date as Record<string, unknown>).gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      (where.date as Record<string, unknown>).lte = new Date(filters.endDate)
    }
  }

  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  })
}

export async function createTransaction(data: FormData) {
  const raw = {
    type: data.get("type"),
    amount: data.get("amount"),
    date: data.get("date"),
    note: data.get("note"),
    categoryId: data.get("categoryId"),
  }

  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await prisma.transaction.create({ data: parsed.data })
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function updateTransaction(id: string, data: FormData) {
  const raw = {
    type: data.get("type"),
    amount: data.get("amount"),
    date: data.get("date"),
    note: data.get("note"),
    categoryId: data.get("categoryId"),
  }

  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await prisma.transaction.update({ where: { id }, data: parsed.data })
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function getTransactionStats(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: { category: true },
  })

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = income - expenses

  // Spending by category
  const categorySpending = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const catName = t.category.name
        const catIcon = t.category.icon
        acc[catName] = {
          amount: (acc[catName]?.amount ?? 0) + t.amount,
          icon: catIcon,
          categoryId: t.categoryId,
        }
        return acc
      },
      {} as Record<string, { amount: number; icon: string; categoryId: string }>
    )

  return { income, expenses, balance, categorySpending, transactions }
}

export async function getMonthlyTrends(months: number = 6) {
  const now = new Date()
  const results = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
    })

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const monthName = date.toLocaleDateString("en-US", { month: "short" })

    results.push({ month: monthName, income, expenses, savings: income - expenses })
  }

  return results
}
