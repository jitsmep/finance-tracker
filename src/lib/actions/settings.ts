"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("profileId")?.value || "system-default";
}

export async function getSettings() {
  const profileId = await getLockerId()
  if (!profileId || profileId === "system-default")
    return { id: "", currencyCode: "USD", updatedAt: new Date() }

  try {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } })
    if (!profile) return { id: "", currencyCode: "USD", updatedAt: new Date() }

    let settings = await prisma.settings.findUnique({ where: { id: profileId } })
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: profileId, currencyCode: "USD" },
      })
    }
    return settings
  } catch (e) {
    console.warn("Failed to fetch settings from DB, using defaults:", e)
    return { id: "", currencyCode: "USD", updatedAt: new Date() }
  }
}

export async function updateCurrency(currencyCode: string) {
  const profileId = await getLockerId();
  if (!profileId || profileId === "system-default") return { error: "Device not found" }
  if (!currencyCode) return { error: "Currency code is required" }

  await prisma.settings.upsert({
    where: { id: profileId },
    update: { currencyCode },
    create: { id: profileId, currencyCode },
  })

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateSettings(data: FormData) {
  const currencyCode = data.get("currencyCode") as string
  return updateCurrency(currencyCode)
}

export async function updateNavLayout(layout: string) {
  const cookieStore = await cookies()
  cookieStore.set("nav_layout", layout, { path: "/", maxAge: 31536000 })
  revalidatePath("/")
  return { success: true }
}
