"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getSettings(deviceId: string) {
  if (!deviceId) return { id: "", currencyCode: "USD", updatedAt: new Date() }

  let settings = await prisma.settings.findUnique({ where: { id: deviceId } })

  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: deviceId, currencyCode: "USD" },
    })
  }

  return settings
}

export async function updateCurrency(deviceId: string, currencyCode: string) {
  if (!deviceId) return { error: "Device not found" }
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

export async function updateSettings(deviceId: string, data: FormData) {
  const currencyCode = data.get("currencyCode") as string
  return updateCurrency(deviceId, currencyCode)
}
