"use server"

import { db as prisma } from "@/lib/db"
import { categorySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("profileId")?.value || "system-default";
}

export async function getCategories() {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return []

  return prisma.category.findMany({
    where: { profileId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true, budgets: true } },
    },
  })
}

export async function createCategory(data: FormData) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: { profileId: ["Device not found"] } }

  const raw = {
    name: data.get("name"),
    icon: data.get("icon"),
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const existing = await prisma.category.findUnique({
    where: {
      profileId_name: { profileId, name: parsed.data.name },
    },
  })

  if (existing) return { error: { name: ["Category already exists"] } }

  await prisma.category.create({
    data: { ...parsed.data, isDefault: false, profileId },
  })

  revalidatePath("/")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}

export async function deleteCategory(id: string) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: "Device not found" }

  const category = await prisma.category.findFirst({ where: { id, profileId } })
  if (!category) return { error: "Category not found" }

  const txCount = await prisma.transaction.count({ where: { categoryId: id, profileId } })
  if (txCount > 0) return { error: `Cannot delete: ${txCount} transactions use this category` }

  await prisma.category.delete({ where: { id } })

  revalidatePath("/")
  revalidatePath("/categories")
  return { success: true }
}

export async function updateCategory(id: string, data: FormData) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: "Device not found" }

  const raw = {
    name: data.get("name"),
    icon: data.get("icon"),
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const category = await prisma.category.findFirst({ where: { id, profileId } })
  if (!category) return { error: "Category not found" }

  const existing = await prisma.category.findFirst({
    where: { profileId, name: parsed.data.name, id: { not: id } },
  })
  if (existing) return { error: { name: ["Category already exists"] } }

  await prisma.category.update({
    where: { id },
    data: parsed.data,
  })

  revalidatePath("/")
  revalidatePath("/categories")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}
