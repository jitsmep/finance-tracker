"use server"

import { db as prisma } from "@/lib/db"
import { categorySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("deviceId")?.value || "system-default";
}

export async function getCategories() {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return []

  return prisma.category.findMany({
    where: { deviceId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true, budgets: true } },
    },
  })
}

export async function createCategory(data: FormData) {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { error: { deviceId: ["Device not found"] } }

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

export async function deleteCategory(id: string) {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { error: "Device not found" }

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
