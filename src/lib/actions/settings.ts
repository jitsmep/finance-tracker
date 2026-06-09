"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  let settings = await prisma.settings.findUnique({
    where: { id: "default" },
  })
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default", currencyCode: "USD" },
    })
  }
  return settings
}

export async function updateCurrency(currencyCode: string) {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: { currencyCode },
    create: { id: "default", currencyCode },
  })
  revalidatePath("/")
  revalidatePath("/transactions")
  revalidatePath("/budgets")
  return { success: true }
}
