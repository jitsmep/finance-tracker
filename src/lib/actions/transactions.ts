"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// 🚀 Read the unique locker ID from the cookie!
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("deviceId")?.value || "system-default";
}

export async function getTransactions(filters?: any) {
  const currentDeviceId = await getLockerId();
  const where: any = { deviceId: currentDeviceId }

  if (filters?.type && filters.type !== "all") where.type = filters.type
  if (filters?.categoryId && filters.categoryId !== "all") where.categoryId = filters.categoryId
  
  if (filters?.startDate || filters?.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = new Date(filters.startDate)
    if (filters.endDate) where.date.lte = new Date(filters.endDate)
  }

  return prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  })
}

export async function createTransaction(data: FormData) {
  const currentDeviceId = await getLockerId();
  const amount = parseFloat(data.get("amount") as string)
  const date = new Date(data.get("date") as string)

  await prisma.transaction.create({ 
    data: { 
      type: data.get("type") as string,
      amount,
      date,
      note: data.get("note") as string | null,
      categoryId: data.get("categoryId") as string,
      deviceId: currentDeviceId 
    } 
  })
  
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function updateTransaction(id: string, data: FormData) {
  const amount = parseFloat(data.get("amount") as string)
  const date = new Date(data.get("date") as string)

  await prisma.transaction.update({ 
    where: { id }, 
    data: {
      type: data.get("type") as string,
      amount,
      date,
      note: data.get("note") as string | null,
      categoryId: data.get("categoryId") as string,
    } 
  })
  
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
  const currentDeviceId = await getLockerId();
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: { deviceId: currentDeviceId, date: { gte: startDate, lte: endDate } },
    include: { category: true },
  })

  const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const categorySpending = transactions.filter((t) => t.type === "expense").reduce((acc, t) => {
    const catName = t.category.name
    acc[catName] = {
      amount: (acc[catName]?.amount ?? 0) + t.amount,
      icon: t.category.icon,
      categoryId: t.categoryId,
    }
    return acc
  }, {} as Record<string, { amount: number; icon: string; categoryId: string }>)

  return { income, expenses, balance: income - expenses, categorySpending, transactions }
}

export async function getMonthlyTrends(months: number = 6) {
  const currentDeviceId = await getLockerId();
  const now = new Date()
  const results = []

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

    const transactions = await prisma.transaction.findMany({
      where: { deviceId: currentDeviceId, date: { gte: startDate, lte: endDate } },
    })

    const income = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    results.push({ month: date.toLocaleDateString("en-US", { month: "short" }), income, expenses, savings: income - expenses })
  }
  return results
}
