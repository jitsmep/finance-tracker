"use server"

import { db as prisma } from "@/lib/db"
import { categorySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function getCategories(deviceId: string) {
  if (!deviceId) return []

  return prisma.category.findMany({
    where: { deviceId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true, budgets: true } },
    },
  })
}

export async function createCategory(deviceId: string, data: FormData) {
  if (!deviceId) return { error: { deviceId: ["Device not found"] } }

  const raw = {
    name: data.get("name"),
    icon: data.get("icon"),
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.category.findUnique({
    where: {
      deviceId_name: { deviceId, name: parsed.data.name },
    },
  })

  if (existing) return { error: { name: ["Category already exists"] } }

  await prisma.category.create({
    data: { ...parsed.data, isDefault: false, deviceId },
  })

  revalidatePath("/")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteCategory(deviceId: string, id: string) {
  if (!deviceId) return { error: "Device not found" }

  const category = await prisma.category.findFirst({ where: { id, deviceId } })
  if (!category) return { error: "Category not found" }
  if (category.isDefault) return { error: "Cannot delete default categories" }

  const txCount = await prisma.transaction.count({ where: { categoryId: id, deviceId } })
  if (txCount > 0) return { error: `Cannot delete: ${txCount} transactions use this category` }

  await prisma.category.delete({ where: { id } })

  revalidatePath("/")
  revalidatePath("/categories")
  return { success: true }
}
