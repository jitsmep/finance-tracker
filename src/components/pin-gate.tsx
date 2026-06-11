"use client"

import { useState, useEffect, useRef } from "react"
import {
  getDeviceId,
  setDeviceId,
  getStoredPin,
  setStoredPin,
  isAuthenticated,
  setAuthenticated,
} from "@/lib/device"
import { registerDevice, verifyDevicePin } from "@/lib/actions/device-actions"

interface PinGateProps {
  children: React.ReactNode
}

type Mode = "loading" | "set-pin" | "enter-pin" | "authenticated"

export function PinGate({ children }: PinGateProps) {
  const [mode, setMode] = useState<Mode>("loading")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [step, setStep] = useState<"enter" | "confirm">("enter")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const deviceId = getDeviceId()
    const storedPin = getStoredPin()

    if (!deviceId || !storedPin) {
      setMode("set-pin")
    } else if (isAuthenticated()) {
      setMode("authenticated")
    } else {
      setMode("enter-pin")
    }
  }, [])

  useEffect(() => {
    if (mode !== "loading" && mode !== "authenticated") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [mode, step])

  // FIX: We now accept the `completedPin` so we don't check stale React state!
  async function handleSetPin(completedPin?: string) {
    const checkPin = step === "enter" ? (completedPin || pin) : pin;
    const checkConfirm = step === "confirm" ? (completedPin || confirmPin) : confirmPin;

    if (checkPin.length !== 4) {
      setError("PIN must be 4 digits")
      return
    }
    if (step === "enter") {
      setStep("confirm")
      setConfirmPin("")
      setError("")
      return
    }
    if (checkPin !== checkConfirm) {
      setError("PINs don't match. Try again.")
      setStep("enter")
      setPin("")
      setConfirmPin("")
      return
    }

    setLoading(true)
    try {
      const { deviceId } = await registerDevice(checkPin)
      setDeviceId(deviceId)
      setStoredPin(checkPin)
      setAuthenticated(true)
      setMode("authenticated")
    } catch {
      setError("Failed to set up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // FIX: Accept the `completedPin` here too!
  async function handleEnterPin(completedPin?: string) {
    const checkPin = completedPin || pin;
    
    if (checkPin.length !== 4) return
    setLoading(true)
    const deviceId = getDeviceId()!
    try {
      const { success } = await verifyDevicePin(deviceId, checkPin)
      if (success) {
        setAuthenticated(true)
        setMode("authenticated")
      } else {
        setError("Incorrect PIN. Try again.")
        setPin("")
      }
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (mode === "authenticated") {
    return <>{children}</>
  }

  const isSettingPin = mode === "set-pin"
  const currentPin = step === "confirm" ? confirmPin : pin
  const setCurrentPin = step === "confirm" ? setConfirmPin : setPin

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
            🔐
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {isSettingPin
              ? step === "enter"
                ? "Create your PIN"
                : "Confirm your PIN"
              : "Enter your PIN"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSettingPin
              ? step === "enter"
                ? "Choose a 4-digit PIN to secure your data on this device"
                : "Enter your PIN again to confirm"
              : "Your data is protected with a PIN"}
          </p>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                i < currentPin.length
                  ? "bg-primary border-primary scale-110"
                  : "border-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        {/* Hidden input */}
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={currentPin}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 4)
            setCurrentPin(val)
            setError("")
            if (val.length === 4) {
              if (isSettingPin) {
                // Pass the fresh value directly!
                setTimeout(() => handleSetPin(val), 100) 
              } else {
                setTimeout(() => handleEnterPin(val), 100)
              }
            }
          }}
          className="sr-only"
          autoComplete="off"
        />

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key, i) => {
            if (key === null) return <div key={i} />
            return (
              <button
                key={i}
                onClick={() => {
                  if (key === "del") {
                    setCurrentPin(currentPin.slice(0, -1))
                    setError("")
                  } else {
                    if (currentPin.length < 4) {
                      const next = currentPin + String(key)
                      setCurrentPin(next)
                      setError("")
                      if (next.length === 4) {
                        if (isSettingPin) {
                          // Pass the fresh value directly!
                          setTimeout(() => handleSetPin(next), 100) 
                        } else {
                          setTimeout(() => handleEnterPin(next), 100)
                        }
                      }
                    }
                  }
                }}
                disabled={loading}
                className="h-14 rounded-2xl bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-lg font-semibold text-foreground disabled:opacity-50"
              >
                {key === "del" ? "⌫" : key}
              </button>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive animate-shake">{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}
