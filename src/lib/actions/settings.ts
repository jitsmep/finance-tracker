"use server"

// 1. Safe database connection
import { db as prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

const currentDeviceId = "system-default"

export async function getSettings() {
  // 2. Fetch settings securely for THIS specific locker
  let settings = await prisma.settings.findUnique({
    where: { id: currentDeviceId }
  })

  // 3. Auto-seed settings if they don't exist yet so the Dashboard doesn't crash!
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: currentDeviceId,
        currencyCode: "USD",
      }
    })
  }

  return settings
}

export async function updateSettings(data: FormData) {
  const currencyCode = data.get("currencyCode") as string

  if (!currencyCode) return { error: "Currency code is required" }

  await prisma.settings.upsert({
    where: { id: currentDeviceId },
    update: { currencyCode },
    create: {
      id: currentDeviceId,
      currencyCode,
    }
  })

  revalidatePath("/")
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  revalidatePath("/portfolio")
  return { success: true }
}
