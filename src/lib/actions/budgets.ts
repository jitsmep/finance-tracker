"use server"

import { db as prisma } from "@/lib/db"
import { budgetSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

const currentDeviceId = "system-default"

export async function getBudgets(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const budgets = await prisma.budget.findMany({
    where: { 
      deviceId: currentDeviceId, // Lock to this device
      month: m, 
      year: y 
    },
    include: { category: true },
  })

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          deviceId: currentDeviceId, // Ensure spent math only counts THIS locker's transactions
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

  // CLEVER FIX: Instead of relying on compound keys that might crash, 
  // we do a simple manual check-and-update to keep Vercel happy!
  const existingBudget = await prisma.budget.findFirst({
    where: {
      deviceId: currentDeviceId,
      categoryId: parsed.data.categoryId,
      month: parsed.data.month,
      year: parsed.data.year,
    }
  })

  if (existingBudget) {
    // If it exists, update it
    await prisma.budget.update({
      where: { id: existingBudget.id },
      data: { limit: parsed.data.limit }
    })
  } else {
    // If it doesn't exist, create it and stamp the deviceId
    await prisma.budget.create({
      data: {
        ...parsed.data,
        deviceId: currentDeviceId
      }
    })
  }

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
