"use server"

import { db as prisma } from "@/lib/db"
import { transactionSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Helper to get the current profile/device ID from cookies
async function getLockerId() {
  const cookieStore = await cookies()
  return cookieStore.get("profileId")?.value || "system-default"
}

// Fetch all transactions for the current profile
export async function getTransactions() {
  const profileId = await getLockerId()
  if (!profileId || profileId === "system-default") return []
  try {
    return await prisma.transaction.findMany({
      where: { profileId },
      orderBy: { date: "desc" },
    })
  } catch (e) {
    console.warn("Failed to fetch transactions, returning empty list", e)
    return []
  }
}

// Create a new transaction
export async function createTransaction(data: FormData) {
  const profileId = await getLockerId()
  if (!profileId || profileId === "system-default")
    return { error: { profileId: ["Device not found"] } }

  const raw = {
    amount: data.get("amount"),
    type: data.get("type"),
    categoryId: data.get("categoryId"),
    date: data.get("date"),
    description: data.get("description"),
  }
  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.transaction.create({ data: { ...parsed.data, profileId } })
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true }
}

// Update an existing transaction
export async function updateTransaction(id: string, data: FormData) {
  const profileId = await getLockerId()
  if (!profileId || profileId === "system-default")
    return { error: { profileId: ["Device not found"] } }

  const raw = {
    amount: data.get("amount"),
    type: data.get("type"),
    categoryId: data.get("categoryId"),
    date: data.get("date"),
    description: data.get("description"),
  }
  const parsed = transactionSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await prisma.transaction.update({
    where: { id, profileId },
    data: parsed.data,
  })
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true }
}

// Delete a transaction
export async function deleteTransaction(id: string) {
  const profileId = await getLockerId()
  if (!profileId || profileId === "system-default")
    return { error: "Device not found" }

  await prisma.transaction.deleteMany({ where: { id, profileId } })
  revalidatePath("/dashboard")
  revalidatePath("/transactions")
  return { success: true }
}

// Compute simple stats for the current profile
export async function getTransactionStats() {
  try {
    const profileId = await getLockerId()
    if (!profileId || profileId === "system-default")
      throw new Error("Device not found")

    const transactions = await prisma.transaction.findMany({
      where: { profileId },
      include: { category: true },
    })

    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const categoryMap = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const name = t.category?.name || "Uncategorized"
        const icon = t.category?.icon || "❓"
        acc[name] = acc[name] || { name, icon, amount: 0 }
        acc[name].amount += t.amount
        return acc
      }, {} as Record<string, { name: string; icon: string; amount: number }>)

    return {
      income,
      expenses,
      balance: income - expenses,
      transactions,
      categorySpending: categoryMap,
    }
  } catch (error) {
    return { income: 0, expenses: 0, balance: 0, transactions: [], categorySpending: {} }
  }
}

// Get monthly trends for the last `months` months (default 6)
export async function getMonthlyTrends(months: number = 6) {
  try {
    const profileId = await getLockerId()
    if (!profileId || profileId === "system-default")
      throw new Error("Device not found")

    const now = new Date()
    const results: { month: string; income: number; expenses: number; savings: number }[] = []

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      
      let transactions: any[] = []
      try {
        transactions = await prisma.transaction.findMany({
          where: { profileId, date: { gte: startDate, lte: endDate } },
        })
      } catch (e) {
        console.warn("Failed to fetch transactions for trend, skipping month", e)
        continue
      }
      
      const income = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
        
      results.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        income,
        expenses,
        savings: income - expenses,
      })
    }
    return results
  } catch (e) {
    console.error("Failed to fetch monthly trends:", e)
    return []
  }
}
