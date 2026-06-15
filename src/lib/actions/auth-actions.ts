"use server"

import { db as prisma } from "@/lib/db"
import { cookies } from "next/headers"

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

export async function signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { success: false, error: "Email already in use" }

    const user = await prisma.user.create({
      data: { email, password },
    })

    const cookieStore = await cookies()
    cookieStore.set("userId", user.id, { path: "/", maxAge: 31536000 })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to sign up" }
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.password !== password) {
      return { success: false, error: "Invalid email or password" }
    }

    const cookieStore = await cookies()
    cookieStore.set("userId", user.id, { path: "/", maxAge: 31536000 })
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to log in" }
  }
}

export async function logout(): Promise<{ success: boolean }> {
  const cookieStore = await cookies()
  cookieStore.delete("userId")
  cookieStore.delete("profileId")
  return { success: true }
}

export async function getUserProfiles() {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return []

  return await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  })
}

export async function createProfile(name: string, pin?: string): Promise<{ success: boolean; error?: string; profileId?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return { success: false, error: "Not authenticated" }

  try {
    const profile = await prisma.profile.create({
      data: { userId, name, pin: pin || null },
    })

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        profileId: profile.id,
        name: cat.name,
        icon: cat.icon,
        isDefault: true,
      })),
      skipDuplicates: true,
    })

    await prisma.settings.create({
      data: {
        id: profile.id,
        currencyCode: "USD",
        updatedAt: new Date(),
      },
    })

    cookieStore.set("profileId", profile.id, { path: "/", maxAge: 31536000 })
    return { success: true, profileId: profile.id }
  } catch (error) {
    return { success: false, error: "Failed to create profile" }
  }
}

export async function switchProfile(profileId: string, pin?: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return { success: false, error: "Not authenticated" }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  if (!profile || profile.userId !== userId) {
    return { success: false, error: "Profile not found" }
  }

  if (profile.pin && profile.pin !== pin) {
    return { success: false, error: "Incorrect PIN" }
  }

  cookieStore.set("profileId", profile.id, { path: "/", maxAge: 31536000 })
  return { success: true }
}

export async function getActiveProfile() {
  const cookieStore = await cookies()
  const profileId = cookieStore.get("profileId")?.value
  if (!profileId) return null

  return await prisma.profile.findUnique({
    where: { id: profileId }
  })
}

export async function updateProfilePin(
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const profileId = cookieStore.get("profileId")?.value
  if (!profileId) return { success: false, error: "No active profile" }

  if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return { success: false, error: "New PIN must be 4 digits" }
  }

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
  })

  if (!profile) return { success: false, error: "Profile not found" }
  if (profile.pin && profile.pin !== oldPin) {
    return { success: false, error: "Current PIN is incorrect" }
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: { pin: newPin },
  })

  return { success: true }
}
