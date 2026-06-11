"use server"

// 1. Fixed the import to use our safe database connection
import { db as prisma } from "@/lib/db"
import { categorySchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"

// Hardcode the default PIN/deviceId for now to match the rest of the app
const currentDeviceId = "system-default"

export async function getCategories() {
  return prisma.category.findMany({
    // 2. Only fetch categories for this specific device!
    where: { deviceId: currentDeviceId },
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

  // 3. Fixed duplicate check to use the compound unique key (deviceId + name)
  const existing = await prisma.category.findUnique({
    where: { 
      deviceId_name: {
        deviceId: currentDeviceId,
        name: parsed.data.name
      }
    },
  })
  
  if (existing) {
    return { error: { name: ["Category already exists"] } }
  }

  // 4. Injected the deviceId into the creation payload
  await prisma.category.create({
    data: { 
      ...parsed.data, 
      isDefault: false,
      deviceId: currentDeviceId 
    },
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
