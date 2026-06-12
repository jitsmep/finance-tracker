"use client"

import { useState, useEffect, useRef } from "react"
import {
  getDeviceId,
  setDeviceId,
  getStoredPin,
  setStoredPin,
  isAuthenticated,
  setAuthenticated,
  getSecurityQuestion,
  setSecurityQuestion,
  getSecurityAnswer,
  setSecurityAnswer,
  verifySecurityAnswer,
  isPasscodeEnabled,
  SECURITY_QUESTIONS,
} from "@/lib/device"
import { registerDevice, verifyDevicePin, resetDevicePin } from "@/lib/actions/device-actions"

interface PinGateProps {
  children: React.ReactNode
}

type Mode =
  | "loading"
  | "set-pin"
  | "set-security-question"
  | "enter-pin"
  | "forgot-pin"
  | "reset-pin"
  | "authenticated"

export function PinGate({ children }: PinGateProps) {
  const [mode, setMode] = useState<Mode>("loading")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [step, setStep] = useState<"enter" | "confirm">("enter")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null)
  const [newPinForReset, setNewPinForReset] = useState("")

  // Security question state
  const [selectedQuestion, setSelectedQuestion] = useState<string>(SECURITY_QUESTIONS[0])
  const [securityAnswer, setSecurityAnswerInput] = useState("")
  const [securityAnswerError, setSecurityAnswerError] = useState("")

  // Forgot PIN state
  const [forgotAnswer, setForgotAnswer] = useState("")
  const [forgotError, setForgotError] = useState("")

  const inputRef = useRef<HTMLInputElement>(null)
  const answerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const deviceId = getDeviceId()
    const storedPin = getStoredPin()
    const passcodeEnabled = isPasscodeEnabled()

    if (!passcodeEnabled) {
      setAuthenticated(true)
      setMode("authenticated")
    } else if (!deviceId || !storedPin) {
      setMode("set-pin")
    } else if (isAuthenticated()) {
      setMode("authenticated")
    } else {
      setMode("enter-pin")
    }
  }, [])

  useEffect(() => {
    if (mode !== "loading" && mode !== "authenticated" && mode !== "set-security-question" && mode !== "forgot-pin") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (mode === "set-security-question") {
      setTimeout(() => answerRef.current?.focus(), 300)
    }
    if (mode === "forgot-pin") {
      setTimeout(() => answerRef.current?.focus(), 300)
    }
  }, [mode, step])

  async function handleSetPin(completedPin?: string) {
    const checkPin = step === "enter" ? (completedPin || pin) : pin
    const checkConfirm = step === "confirm" ? (completedPin || confirmPin) : confirmPin

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
      setNewDeviceId(deviceId)
      setDeviceId(deviceId)
      setStoredPin(checkPin)
      // Move to security question setup
      setMode("set-security-question")
      setPin("")
      setConfirmPin("")
      setStep("enter")
    } catch {
      setError("Failed to set up. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSetSecurityQuestion() {
    if (!securityAnswer.trim() || securityAnswer.trim().length < 2) {
      setSecurityAnswerError("Please enter a valid answer (at least 2 characters).")
      return
    }
    setSecurityQuestion(selectedQuestion)
    setSecurityAnswer(securityAnswer)
    setAuthenticated(true)
    setMode("authenticated")
  }

  async function handleEnterPin(completedPin?: string) {
    const checkPin = completedPin || pin
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

  function handleForgotPinSubmit() {
    if (!forgotAnswer.trim()) {
      setForgotError("Please enter your answer.")
      return
    }
    const correct = verifySecurityAnswer(forgotAnswer)
    if (!correct) {
      setForgotError("Incorrect answer. Please try again.")
      return
    }
    // Correct — go to reset-pin mode
    setForgotError("")
    setForgotAnswer("")
    setMode("reset-pin")
    setNewPinForReset("")
    setPin("")
    setConfirmPin("")
    setStep("enter")
    setError("")
  }

  async function handleResetPin(completedPin?: string) {
    const checkPin = step === "enter" ? (completedPin || pin) : pin
    const checkConfirm = step === "confirm" ? (completedPin || confirmPin) : confirmPin

    if (checkPin.length !== 4) return
    if (step === "enter") {
      setNewPinForReset(checkPin)
      setStep("confirm")
      setConfirmPin("")
      setError("")
      return
    }
    if (newPinForReset !== checkConfirm) {
      setError("PINs don't match. Try again.")
      setStep("enter")
      setPin("")
      setConfirmPin("")
      setNewPinForReset("")
      return
    }

    setLoading(true)
    const deviceId = getDeviceId()!
    try {
      const result = await resetDevicePin(deviceId, newPinForReset)
      if (result.success) {
        setStoredPin(newPinForReset)
        setAuthenticated(true)
        setMode("authenticated")
      } else {
        setError(result.error || "Failed to reset PIN.")
      }
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  if (mode === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center pin-gate-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
            <span className="text-2xl">💰</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (mode === "authenticated") {
    return <>{children}</>
  }

  // === SECURITY QUESTION SETUP ===
  if (mode === "set-security-question") {
    const hasStoredQuestion = getSecurityQuestion() !== null
    return (
      <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
        <div className="w-full max-w-sm animate-pin-slide-up">
          {/* Card */}
          <div className="pin-gate-card rounded-3xl p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl shadow-lg shadow-primary/20">
                🛡️
              </div>
            </div>
            {/* Title */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Security Recovery</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Set a security question to recover your account if you forget your PIN.
              </p>
            </div>

            {/* Question Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Security Question</label>
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/60 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Your Answer</label>
              <input
                ref={answerRef}
                type="text"
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswerInput(e.target.value)
                  setSecurityAnswerError("")
                }}
                placeholder="Type your answer..."
                className="w-full p-3 rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                autoComplete="off"
              />
              {securityAnswerError && (
                <p className="text-xs text-destructive">{securityAnswerError}</p>
              )}
              <p className="text-xs text-muted-foreground">Answer is case-insensitive.</p>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleSetSecurityQuestion}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/30"
              >
                Save & Continue →
              </button>
              {hasStoredQuestion && (
                <button
                  onClick={() => { setAuthenticated(true); setMode("authenticated") }}
                  className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // === FORGOT PIN — Answer Security Question ===
  if (mode === "forgot-pin") {
    const question = getSecurityQuestion()
    const hasQuestion = !!question && !!getSecurityAnswer()

    return (
      <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
        <div className="w-full max-w-sm animate-pin-slide-up">
          <div className="pin-gate-card rounded-3xl p-8 space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/15 flex items-center justify-center text-3xl shadow-lg shadow-warning/20">
                🔓
              </div>
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Forgot PIN?</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hasQuestion
                  ? "Answer your security question to reset your PIN."
                  : "No security question set. Please contact support or reset your device."}
              </p>
            </div>

            {hasQuestion ? (
              <>
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Your Question</p>
                  <p className="text-sm font-semibold text-foreground">{question}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Your Answer</label>
                  <input
                    ref={answerRef}
                    type="text"
                    value={forgotAnswer}
                    onChange={(e) => {
                      setForgotAnswer(e.target.value)
                      setForgotError("")
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPinSubmit()}
                    placeholder="Type your answer..."
                    className="w-full p-3 rounded-xl bg-secondary/60 border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                    autoComplete="off"
                  />
                  {forgotError && (
                    <p className="text-xs text-destructive animate-shake">{forgotError}</p>
                  )}
                </div>

                <button
                  onClick={handleForgotPinSubmit}
                  className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-primary/30"
                >
                  Verify Answer
                </button>
              </>
            ) : (
              <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">No recovery method available. You may need to reset your device data in Settings.</p>
              </div>
            )}

            <button
              onClick={() => { setMode("enter-pin"); setForgotAnswer(""); setForgotError("") }}
              className="w-full py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition flex items-center justify-center gap-2"
            >
              ← Back to PIN
            </button>
          </div>
        </div>
      </div>
    )
  }

  // === SET PIN or RESET PIN ===
  const isSettingPin = mode === "set-pin"
  const isResettingPin = mode === "reset-pin"
  const isPinMode = isSettingPin || isResettingPin
  const currentPin = step === "confirm" ? confirmPin : pin
  const setCurrentPin = step === "confirm" ? setConfirmPin : setPin
  const handlePinAction = isPinMode
    ? isResettingPin
      ? (p?: string) => handleResetPin(p)
      : (p?: string) => handleSetPin(p)
    : (p?: string) => handleEnterPin(p)

  const modeTitle = isSettingPin
    ? step === "enter" ? "Create Your PIN" : "Confirm Your PIN"
    : isResettingPin
    ? step === "enter" ? "New PIN" : "Confirm New PIN"
    : "Welcome Back"

  const modeSubtitle = isSettingPin
    ? step === "enter"
      ? "Choose a 4-digit PIN to secure your data"
      : "Re-enter your PIN to confirm"
    : isResettingPin
    ? step === "enter"
      ? "Choose a new 4-digit PIN"
      : "Re-enter your new PIN to confirm"
    : "Enter your PIN to unlock"

  const modeIcon = isSettingPin ? "🔐" : isResettingPin ? "🔑" : "💰"

  return (
    <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
      <div className="w-full max-w-sm animate-pin-slide-up">
        <div className="pin-gate-card rounded-3xl p-8 space-y-6">

          {/* Progress steps for set-pin */}
          {isSettingPin && (
            <div className="flex items-center justify-center gap-2">
              <div className={`h-1 w-12 rounded-full transition-all duration-300 ${step === "enter" ? "bg-primary" : "bg-primary/40"}`} />
              <div className={`h-1 w-12 rounded-full transition-all duration-300 ${step === "confirm" ? "bg-primary" : "bg-muted"}`} />
            </div>
          )}

          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center text-4xl shadow-xl shadow-primary/20 pin-icon-float">
              {modeIcon}
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{modeTitle}</h1>
            <p className="text-sm text-muted-foreground">{modeSubtitle}</p>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  i < currentPin.length
                    ? "bg-primary border-primary scale-125 shadow-md shadow-primary/40"
                    : "border-border"
                }`}
              />
            ))}
          </div>

          {/* Hidden input for keyboard support */}
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
                setTimeout(() => handlePinAction(val), 100)
              }
            }}
            className="sr-only"
            autoComplete="off"
          />

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
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
                          setTimeout(() => handlePinAction(next), 100)
                        }
                      }
                    }
                  }}
                  disabled={loading}
                  className="h-14 rounded-2xl pin-numpad-key text-xl font-semibold text-foreground disabled:opacity-40 transition-all active:scale-90"
                >
                  {key === "del" ? "⌫" : key}
                </button>
              )
            })}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center animate-shake font-medium">{error}</p>
          )}

          {/* Loading spinner */}
          {loading && (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Forgot PIN link — only on enter-pin mode */}
          {mode === "enter-pin" && !loading && (
            <button
              onClick={() => { setMode("forgot-pin"); setError("") }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center py-1"
            >
              Forgot Passcode?
            </button>
          )}
        </div>

        {/* App branding */}
        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          Finance Tracker • Secure & Private
        </p>
      </div>
    </div>
  )
}
