"use server"

import { db as prisma } from "@/lib/db"
import { budgetSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("profileId")?.value || "system-default";
}

export async function getBudgets(month?: number, year?: number) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return [];

  const now = new Date();
  const m = month ?? now.getMonth() + 1;
  const y = year ?? now.getFullYear();

  let budgets = [];
  try {
    budgets = await prisma.budget.findMany({
      where: { profileId, month: m, year: y },
      include: { category: true },
    });
  } catch (e) {
    console.warn("Failed to fetch budgets, returning empty list", e);
    return [];
  }

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      try {
        const spent = await prisma.transaction.aggregate({
          where: {
            profileId,
            categoryId: budget.categoryId,
            type: "expense",
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        });
        return {
          ...budget,
          spent: spent._sum.amount ?? 0,
          percentage: Math.min(
            100,
            Math.round(((spent._sum.amount ?? 0) / budget.limit) * 100)
          ),
        };
      } catch (e) {
        console.warn(`Failed to aggregate spent for budget ${budget.id}`, e);
        return {
          ...budget,
          spent: 0,
          percentage: 0,
        };
      }
    })
  );

  return budgetsWithSpent;
}

export async function upsertBudget(data: FormData) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: { profileId: ["Device not found"] } }

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
      profileId,
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
      data: { ...parsed.data, profileId },
    })
  }

  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteBudget(id: string) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: "Device not found" }

  await prisma.budget.deleteMany({ where: { id, profileId } })

  revalidatePath("/")
  revalidatePath("/budgets")
  return { success: true }
}
