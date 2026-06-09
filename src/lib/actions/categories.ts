"use server"

import { prisma } from "@/lib/prisma"
import { categorySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { transactions: true, budgets: true },
      },
    },
  })
}

export async function createCategory(data: FormData) {
  const raw = {
    name: data.get("name"),
    icon: data.get("icon"),
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  // Check for duplicate name
  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  })
  if (existing) {
    return { error: { name: ["Category already exists"] } }
  }

  await prisma.category.create({
    data: { ...parsed.data, isDefault: false },
  })

  revalidatePath("/")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } })
  if (!category) {
    return { error: "Category not found" }
  }
  if (category.isDefault) {
    return { error: "Cannot delete default categories" }
  }

  // Check if category has transactions
  const txCount = await prisma.transaction.count({
    where: { categoryId: id },
  })
  if (txCount > 0) {
    return { error: `Cannot delete: ${txCount} transactions use this category` }
  }

  await prisma.category.delete({ where: { id } })
  revalidatePath("/")
  revalidatePath("/categories")
  return { success: true }
}
