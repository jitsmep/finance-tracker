"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

// Read the unique locker ID from the cookie
async function getLockerId() {
  const cookieStore = await cookies();
  return cookieStore.get("deviceId")?.value || "system-default";
}

export async function getSettings() {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { id: "", currencyCode: "USD", updatedAt: new Date() }

  let settings = await prisma.settings.findUnique({ where: { id: deviceId } })

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: deviceId, currencyCode: "USD" },
    })
  }

  return settings
}

export async function updateCurrency(currencyCode: string) {
  const deviceId = await getLockerId();
  if (!deviceId || deviceId === "system-default") return { error: "Device not found" }
  if (!currencyCode) return { error: "Currency code is required" }

  await prisma.settings.upsert({
    where: { id: deviceId },
    update: { currencyCode },
    create: { id: deviceId, currencyCode },
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
