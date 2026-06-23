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
  if (!profileId || profileId === "system-default") return [];
  try {
    return await prisma.category.findMany({
      where: { profileId },
      orderBy: { name: "asc" },
    });
  } catch (e) {
    console.warn("Failed to fetch categories, returning empty list", e);
    return [];
  }
}

export async function createCategory(data: FormData) {
  const profileId = await getLockerId();
  // If we are in local‑only mode (no profileId), skip DB and treat as success.
  if (!profileId || profileId === "system-default") {
    // The client will handle local storage updates via FinanceProvider.
    return { success: true };
  }
  // Ensure the profile exists in the database before using it as a foreign key.
  // Ensure the profile exists in the database before using it as a foreign key.
    // Wrap in try/catch to handle DB connectivity issues gracefully.
    let profileExists = null;
    try {
      profileExists = await prisma.profile.findUnique({ where: { id: profileId } });
    } catch (e) {
      console.warn("Failed to verify profile existence, proceeding in local mode:", e);
      // If we can't verify, treat as local mode to avoid FK errors.
      return { success: true };
    }
    if (!profileExists) {
      // If the profile does not exist, treat as local mode to avoid FK violation.
      return { success: true };
    }
  // Redundant check removed – fallback handled above

  const raw = {
    name: data.get("name"),
    icon: data.get("icon"),
  };

  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await prisma.category.findUnique({
    where: { profileId_name: { profileId, name: parsed.data.name } },
  });

  if (existing) return { error: { name: ["Category already exists"] } };

  await prisma.category.create({ data: { ...parsed.data, isDefault: false, profileId } });

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteCategory(id: string) {
  const profileId = await getLockerId();
  // Skip DB when in local mode.
  if (!profileId || profileId === "system-default") return { success: true };

  const category = await prisma.category.findFirst({ where: { id, profileId } });
  if (!category) return { error: "Category not found" };

  const txCount = await prisma.transaction.count({ where: { categoryId: id, profileId } });
  if (txCount > 0) return { error: `Cannot delete: ${txCount} transactions use this category` };

  await prisma.category.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/categories");
  return { success: true };
}

export async function updateCategory(id: string, data: FormData) {
  const profileId = await getLockerId();
  // Skip DB when in local mode.
  if (!profileId || profileId === "system-default") return { success: true };

  const raw = { name: data.get("name"), icon: data.get("icon") };
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const category = await prisma.category.findFirst({ where: { id, profileId } });
  if (!category) return { error: "Category not found" };

  const existing = await prisma.category.findFirst({
    where: { profileId, name: parsed.data.name, id: { not: id } },
  });
  if (existing) return { error: { name: ["Category already exists"] } };

  await prisma.category.update({ where: { id }, data: parsed.data });

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}
