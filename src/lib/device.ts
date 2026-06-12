// src/lib/device.ts
// Runs only on the client side

const DEVICE_ID_KEY = "ft_device_id"
const DEVICE_PIN_KEY = "ft_device_pin"
const DEVICE_AUTHED_KEY = "ft_authed"
const SECURITY_QUESTION_KEY = "ft_security_question"
const SECURITY_ANSWER_KEY = "ft_security_answer"
const PASSCODE_ENABLED_KEY = "ft_passcode_enabled"

// === Security Questions List ===
export const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is the name of your best friend?",
  "What was the make of your first car?",
  "What is your favorite food?",
] as const

// === Device ID ===
export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEVICE_ID_KEY)
}

export function setDeviceId(id: string) {
  localStorage.setItem(DEVICE_ID_KEY, id)
}

// === Stored PIN ===
export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEVICE_PIN_KEY)
}

export function setStoredPin(pin: string) {
  localStorage.setItem(DEVICE_PIN_KEY, pin)
}

// === Authentication Session ===
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return sessionStorage.getItem(DEVICE_AUTHED_KEY) === "true"
}

export function setAuthenticated(value: boolean) {
  if (value) {
    sessionStorage.setItem(DEVICE_AUTHED_KEY, "true")
  } else {
    sessionStorage.removeItem(DEVICE_AUTHED_KEY)
  }
}

// === Security Question ===
export function getSecurityQuestion(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SECURITY_QUESTION_KEY)
}

export function setSecurityQuestion(question: string) {
  localStorage.setItem(SECURITY_QUESTION_KEY, question)
}

// === Security Answer (stored lowercase for case-insensitive comparison) ===
export function getSecurityAnswer(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(SECURITY_ANSWER_KEY)
}

export function setSecurityAnswer(answer: string) {
  localStorage.setItem(SECURITY_ANSWER_KEY, answer.toLowerCase().trim())
}

export function verifySecurityAnswer(answer: string): boolean {
  const stored = getSecurityAnswer()
  if (!stored) return false
  return stored === answer.toLowerCase().trim()
}

// === Passcode Enable/Disable Toggle ===
export function isPasscodeEnabled(): boolean {
  if (typeof window === "undefined") return true
  const val = localStorage.getItem(PASSCODE_ENABLED_KEY)
  // Default to true (enabled) if not set
  return val !== "false"
}

export function setPasscodeEnabled(enabled: boolean) {
  localStorage.setItem(PASSCODE_ENABLED_KEY, enabled ? "true" : "false")
}

// === Clear All Device Data ===
export function clearDevice() {
  localStorage.removeItem(DEVICE_ID_KEY)
  localStorage.removeItem(DEVICE_PIN_KEY)
  localStorage.removeItem(SECURITY_QUESTION_KEY)
  localStorage.removeItem(SECURITY_ANSWER_KEY)
  localStorage.removeItem(PASSCODE_ENABLED_KEY)
  sessionStorage.removeItem(DEVICE_AUTHED_KEY)
}
