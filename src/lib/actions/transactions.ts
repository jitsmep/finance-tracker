"use server"

import { db as prisma } from "@/lib/db"
import { transactionSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function getTransactions(
  deviceId: string,
  filters?: {
    type?: string
    categoryId?: string
    startDate?: string
    endDate?: string
  }
) {
  if (!deviceId) return []

  const where: Record<string, unknown> = { deviceId }

  if (filters?.type && filters.type !== "all") where.type = filters.type
  if (filters?.categoryId && filters.categoryId !== "all") where.categoryId = filters.categoryId
  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) (where.date as Record<string, unknown>).gte = new Date(filters.startDate)
    if (filters.endDate) (where.date as Record<string, unknown>).lte = new Date(filters.endDate)
  }

  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  })
}

export async function createTransaction(deviceId: string, data: FormData) {
  if (!deviceId) return { error: { deviceId: ["Device not found"] } }

  const raw = {
    type: data.get("type"),
    amount: data.get("amount"),
    date: data.get("date"),
    note: data.get("note"),
    categoryId: data.get("categoryId"),
  }

  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.transaction.create({
    data: { ...parsed.data, deviceId },
  })

  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function updateTransaction(deviceId: string, id: string, data: FormData) {
  if (!deviceId) return { error: { deviceId: ["Device not found"] } }

  const raw = {
    type: data.get("type"),
    amount: data.get("amount"),
    date: data.get("date"),
    note: data.get("note"),
    categoryId: data.get("categoryId"),
  }

  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Ensure the transaction belongs to this device
  await prisma.transaction.updateMany({
    where: { id, deviceId },
    data: parsed.data,
  })

  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteTransaction(deviceId: string, id: string) {
  if (!deviceId) return { error: "Device not found" }

  await prisma.transaction.deleteMany({ where: { id, deviceId } })

  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function getTransactionStats(deviceId: string, month?: number, year?: number) {
  if (!deviceId) return { income: 0, expenses: 0, balance: 0, categorySpending: {}, transactions: [] }

  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: { deviceId, date: { gte: startDate, lte: endDate } },
    include: { category: true },
  })

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expenses

  const categorySpending = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const catName = t.category.name
        acc[catName] = {
          amount: (acc[catName]?.amount ?? 0) + t.amount,
          icon: t.category.icon,
          categoryId: t.categoryId,
        }
        return acc
      },
      {} as Record<string, { amount: number; icon: string; categoryId: string }>
    )

  return { income, expenses, balance, categorySpending, transactions }
}

export async function getMonthlyTrends(deviceId: string, months: number = 6) {
  if (!deviceId) return []

  const now = new Date()
  const results = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: { deviceId, date: { gte: startDate, lte: endDate } },
    })

    const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
    const monthName = date.toLocaleDateString("en-US", { month: "short" })

    results.push({ month: monthName, income, expenses, savings: income - expenses })
  }

  return results
}
