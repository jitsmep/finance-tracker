"use server"

import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const currentDeviceId = "system-default"

export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: currentDeviceId },
  })

  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: currentDeviceId,
        currencyCode: "USD",
      },
    })
  }

  return settings
}

export async function updateCurrency(currencyCode: string) {
  if (!currencyCode) {
    return { error: "Currency code is required" }
  }

  await prisma.settings.upsert({
    where: { id: currentDeviceId },
    update: { currencyCode },
    create: {
      id: currentDeviceId,
      currencyCode,
    },
  })

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  revalidatePath("/portfolio")

  return { success: true }
}

export async function updateSettings(data: FormData) {
  const currencyCode = data.get("currencyCode") as string

  return updateCurrency(currencyCode)
}
