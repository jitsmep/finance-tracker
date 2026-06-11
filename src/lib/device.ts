// src/lib/device.ts
// Runs only on the client side

const DEVICE_ID_KEY = "ft_device_id"
const DEVICE_PIN_KEY = "ft_device_pin"
const DEVICE_AUTHED_KEY = "ft_authed"

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEVICE_ID_KEY)
}

export function setDeviceId(id: string) {
  localStorage.setItem(DEVICE_ID_KEY, id)
}

export function getStoredPin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(DEVICE_PIN_KEY)
}

export function setStoredPin(pin: string) {
  localStorage.setItem(DEVICE_PIN_KEY, pin)
}

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

export function clearDevice() {
  localStorage.removeItem(DEVICE_ID_KEY)
  localStorage.removeItem(DEVICE_PIN_KEY)
  sessionStorage.removeItem(DEVICE_AUTHED_KEY)
}
