"use server"

import { db as prisma } from "@/lib/db"
import { budgetSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("deviceId")?.value || "system-default";
}

export async function getBudgets(month?: number, year?: number) {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return []

  const now = new Date()
  const m = month ?? now.getMonth() + 1
  const y = year ?? now.getFullYear()

  const budgets = await prisma.budget.findMany({
    where: { deviceId, month: m, year: y },
    include: { category: true },
  })

  const startDate = new Date(y, m - 1, 1)
  const endDate = new Date(y, m, 0, 23, 59, 59)

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          deviceId,
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
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { error: { deviceId: ["Device not found"] } }

  const raw = {
    limit: data.get("limit"),
    categoryId: data.get("categoryId"),
    month: data.get("month"),
    year: data.get("year"),
  }

  const parsed = budgetSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existingBudget = await prisma.budget.findFirst({
    where: {
      deviceId,
      categoryId: parsed.data.categoryId,
      month: parsed.data.month,
      year: parsed.data.year,
    },
  })

  if (existingBudget) {
    await prisma.budget.update({
      where: { id: existingBudget.id },
      data: { limit: parsed.data.limit },
    })
  } else {
    await prisma.budget.create({
      data: { ...parsed.data, deviceId },
    })
  }

  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteBudget(id: string) {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { error: "Device not found" }

  await prisma.budget.deleteMany({ where: { id, deviceId } })

  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}
