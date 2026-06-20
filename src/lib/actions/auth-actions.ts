"use server"

import { db as prisma } from "@/lib/db"
import { cookies } from "next/headers"
// nodemailer will be required lazily in sendOtpEmail

// Simple in‑memory OTP store for development / when DB is unreachable
// Map<email, { otp: string, expiresAt: Date }>
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

// Helper to send OTP email (uses SMTP if configured, otherwise logs to console)
async function sendOtpEmail(to: string, otp: string) {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const fromAddr = process.env.SMTP_FROM || "no-reply@example.com"

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    // Lazy-load nodemailer to avoid bundling it when not needed
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer') as any
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
    await transporter.sendMail({
      from: fromAddr,
      to,
      subject: "Your Finance Tracker OTP",
      text: `Your one‑time password is ${otp}. It expires in 10 minutes.`,
    })
  } else {
    // Fallback mock – log to console
    console.log(`\n=== EMAIL MOCK ===\nTo: ${to}\nSubject: Your Finance Tracker OTP\nYour OTP is: ${otp}\n==================\n`)
  }
}

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
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPassword = password.trim()
    const existing = await prisma.user.findFirst({ 
      where: { 
        email: { equals: normalizedEmail, mode: "insensitive" } 
      } 
    })
    if (existing) return { success: false, error: "Email already in use" }

    const user = await prisma.user.create({
      data: { email: normalizedEmail, password: normalizedPassword },
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
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPassword = password.trim()
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: normalizedEmail, mode: "insensitive" } 
      } 
    })
    if (!user) {
      console.log('Login debug: user not found for email', normalizedEmail);
      return { success: false, error: "Invalid email or password" };
    }
    console.log('Login debug: stored password', user.password, 'input password', normalizedPassword);
    if (user.password !== normalizedPassword) {
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

export async function continueAsGuest(): Promise<{ success: boolean; error?: string; profileId?: string }> {
  try {
    const guestEmail = `guest_${Date.now()}@example.com`
    const guestPassword = `guest_${Math.random().toString(36).slice(2)}`
    
    const user = await prisma.user.create({
      data: { email: guestEmail, password: guestPassword },
    })

    const cookieStore = await cookies()
    cookieStore.set("userId", user.id, { path: "/", maxAge: 31536000 })
    
    const profile = await prisma.profile.create({
      data: { userId: user.id, name: "Guest", pin: null },
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
    console.error("Guest login error:", error)
    return { success: false, error: "Failed to continue as guest" }
  }
}

export async function getUserEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  })

  return user?.email || null
}

export async function updateUserEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return { success: false, error: "Not authenticated" }

  if (!newEmail || !newEmail.includes("@")) {
    return { success: false, error: "Invalid email address" }
  }

  try {
    const normalizedNewEmail = newEmail.toLowerCase().trim()
    const existing = await prisma.user.findFirst({ 
      where: { 
        email: { equals: normalizedNewEmail, mode: "insensitive" } 
      } 
    })
    if (existing && existing.id !== userId) {
      return { success: false, error: "Email already in use" }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedNewEmail },
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update email" }
  }
}

export async function requestOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    let user = null
    try {
      user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      })
    } catch (dbErr) {
      console.error('requestOtp DB error:', dbErr)
    }

    // Generate a 4‑digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Store the OTP – DB first, fallback to in‑memory store
    try {
      await prisma.otpToken.create({
        data: { email: normalizedEmail, otp, expiresAt },
      })
    } catch (storeErr) {
      console.error('requestOtp store DB error:', storeErr)
      otpStore.set(normalizedEmail, { otp, expiresAt })
    }

    // Send the OTP email (real or mock)
    await sendOtpEmail(normalizedEmail, otp)

    return { success: true }
  } catch (error) {
    console.error('requestOtp unexpected error:', error)
    return { success: false, error: "Failed to request OTP" }
  }
}



// Register a device for syncing data across devices
export async function registerDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("userId")?.value
  if (!userId) return { success: false, error: "Not authenticated" }

  try {
    // Ensure deviceId is unique per user
    await prisma.device.create({
      data: {
        userId,
        deviceId,
      },
    })
    return { success: true }
  } catch (err) {
    console.error("registerDevice error:", err)
    return { success: false, error: "Failed to register device" }
  }
}

export async function verifyOtpAndReset(email: string, otp: string, newPassword?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim()
    // Try to fetch token from DB; fallback to in‑memory store if DB fails
    let tokenRecord = null
    try {
      tokenRecord = await prisma.otpToken.findFirst({
        where: { email: normalizedEmail, otp: otp, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      })
    } catch (dbErr) {
      console.error('verifyOtp DB fetch error:', dbErr)
      const mem = otpStore.get(normalizedEmail)
      if (mem && mem.otp === otp && mem.expiresAt > new Date()) {
        tokenRecord = { email: normalizedEmail, otp: mem.otp, expiresAt: mem.expiresAt } as any
        // remove after use
        otpStore.delete(normalizedEmail)
      }
    }
    if (!tokenRecord) {
      return { success: false, error: "Invalid or expired OTP" }
    }
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    })
    if (!user) {
      return { success: false, error: "User not found" }
    }
    if (newPassword) {
      await prisma.user.update({ where: { id: user.id }, data: { password: newPassword } })
    }
    // Clean up DB tokens; if DB fails, just ensure memory is cleared above
    try {
      await prisma.otpToken.deleteMany({ where: { email: normalizedEmail } })
    } catch (delErr) {
      console.error('verifyOtp delete DB error:', delErr)
    }
    const cookieStore = await cookies()
    cookieStore.set("userId", user.id, { path: "/", maxAge: 31536000 })
    return { success: true }
  } catch (error) {
    console.error('verifyOtp unexpected error:', error)
    return { success: false, error: "Failed to verify OTP" }
  }
}
