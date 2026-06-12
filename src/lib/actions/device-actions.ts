"use server"

import { db as prisma } from "@/lib/db"
import { cookies } from "next/headers"

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

export async function registerDevice(pin: string): Promise<{ deviceId: string }> {
  const device = await prisma.device.create({
    data: { pin }, 
  })

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      deviceId: device.id,
      name: cat.name,
      icon: cat.icon,
      isDefault: true,
    })),
    skipDuplicates: true,
  })

  await prisma.settings.create({
    data: {
      id: device.id,
      currencyCode: "USD",
      updatedAt: new Date(),
    },
  })

  // 🚀 STAMP THE COOKIE SO THE SERVER KNOWS WHICH LOCKER IS YOURS
  const cookieStore = await cookies();
  cookieStore.set("deviceId", device.id, { path: "/", maxAge: 31536000 });

  return { deviceId: device.id }
}

export async function verifyDevicePin(deviceId: string, pin: string): Promise<{ success: boolean }> {
  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  })

  if (!device) return { success: false }
  
  const success = device.pin === pin;
  
  if (success) {
    // 🚀 STAMP THE COOKIE ON LOGIN
    const cookieStore = await cookies();
    cookieStore.set("deviceId", device.id, { path: "/", maxAge: 31536000 });
  }
  
  return { success } 
}

export async function updateDevicePin(
  deviceId: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { success: false, error: "New PIN must be 4 digits" }
  }

  const device = await prisma.device.findUnique({
    where: { id: deviceId },
  })

  if (!device) return { success: false, error: "Device not found" }

  if (device.pin !== oldPin) {
    return { success: false, error: "Current PIN is incorrect" }
  }

  await prisma.device.update({
    where: { id: deviceId },
    data: { pin: newPin },
  })

  return { success: true }
}
