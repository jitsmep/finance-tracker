"use server"

import { prisma } from "@/lib/db"

// Default categories seeded for each new device
const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", icon: "🍔" },
  { name: "Transport", icon: "🚗" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Health", icon: "💊" },
  { name: "Housing", icon: "🏠" },
  { name: "Salary", icon: "💼" },
  { name: "Investment", icon: "📈" },
  { name: "Other", icon: "📌" },
]

// Register a new device with a PIN, return the new deviceId
export async function registerDevice(pin: string): Promise<{ deviceId: string }> {
  const device = await prisma.device.create({
    data: { pin }, // In production, hash this with bcrypt
  })

  // Seed default categories for this device
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      deviceId: device.id,
      name: cat.name,
      icon: cat.icon,
      isDefault: true,
    })),
  })

  // Seed default settings for this device
  await prisma.settings.create({
    data: {
      id: device.id,
      currencyCode: "USD",
      updatedAt: new Date(),
    },
  })

  return { deviceId: device.id }
}

// Verify PIN for existing device
export async function verifyDevicePin(
  deviceId: string,
  pin: string
): Promise<{ success: boolean }> {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  })

  if (!device) return { success: false }
  return { success: device.pin === pin } // Hash comparison in production
}
