"use client"

import { useState, useEffect, useRef } from "react"
import {
  login,
  signUp,
  logout,
  getUserProfiles,
  createProfile,
  switchProfile,
  continueAsGuest,
} from "@/lib/actions/auth-actions"

interface AuthGateProps {
  initialUserId: string | null
  initialProfileId: string | null
  children: React.ReactNode
}

type Mode =
  | "loading"
  | "login"
  | "signup"
  | "select-profile"
  | "create-profile"
  | "enter-pin"
  | "authenticated"

export function AuthGate({ initialUserId, initialProfileId, children }: AuthGateProps) {
  const [mode, setMode] = useState<Mode>("loading")
  const [userId, setUserId] = useState<string | null>(initialUserId)
  const [profileId, setProfileId] = useState<string | null>(initialProfileId)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null)
  
  const [profileName, setProfileName] = useState("")
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [step, setStep] = useState<"enter" | "confirm">("enter")

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) {
      setMode("login")
    } else if (!profileId) {
      loadProfiles()
      setMode("select-profile")
    } else {
      const isAuthed = sessionStorage.getItem(`profileAuth_${profileId}`) === "true"
      if (isAuthed) {
        setMode("authenticated")
      } else {
        // Find if profile has PIN
        loadProfiles().then((profs) => {
          const prof = profs.find(p => p.id === profileId)
          if (prof && prof.pin) {
            setSelectedProfile(prof)
            setMode("enter-pin")
          } else {
            sessionStorage.setItem(`profileAuth_${profileId}`, "true")
            setMode("authenticated")
          }
        })
      }
    }
  }, [userId, profileId])

  useEffect(() => {
    if (mode === "enter-pin" || mode === "create-profile") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [mode, step])

  async function loadProfiles() {
    const data = await getUserProfiles()
    setProfiles(data)
    return data
  }

  async function handleAuth(action: "login" | "signup") {
    setLoading(true)
    setError("")
    try {
      const result = action === "login" ? await login(email, password) : await signUp(email, password)
      if (result.success) {
        // Will trigger refresh or we can just update local state
        // To be safe, reload page so cookies are fresh
        window.location.reload()
      } else {
        setError(result.error || "Authentication failed")
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleGuestLogin() {
    setLoading(true)
    setError("")
    try {
      const result = await continueAsGuest()
      if (result.success && result.profileId) {
        sessionStorage.setItem(`profileAuth_${result.profileId}`, "true")
        window.location.reload()
      } else {
        setError(result.error || "Failed to continue as guest")
      }
    } catch {
      setError("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateProfile(completedPin?: string) {
    if (!profileName.trim()) {
      setError("Profile name is required")
      return
    }

    // Profile PIN is optional. If they entered nothing, we create without PIN.
    const hasPin = pin.length > 0
    if (hasPin) {
      const checkPin = step === "enter" ? (completedPin || pin) : pin
      const checkConfirm = step === "confirm" ? (completedPin || confirmPin) : confirmPin

      if (checkPin.length !== 4) return
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
    }

    setLoading(true)
    try {
      const result = await createProfile(profileName, hasPin ? pin : undefined)
      if (result.success) {
        sessionStorage.setItem(`profileAuth_${result.profileId}`, "true")
        window.location.reload()
      } else {
        setError(result.error || "Failed to create profile")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectProfile(prof: any) {
    if (prof.pin) {
      setSelectedProfile(prof)
      setMode("enter-pin")
      setPin("")
      setError("")
    } else {
      setLoading(true)
      const res = await switchProfile(prof.id)
      if (res.success) {
        sessionStorage.setItem(`profileAuth_${prof.id}`, "true")
        window.location.reload()
      } else {
        setError("Failed to switch profile")
        setLoading(false)
      }
    }
  }

  async function handleEnterPin(completedPin?: string) {
    const checkPin = completedPin || pin
    if (checkPin.length !== 4) return
    setLoading(true)
    try {
      const result = await switchProfile(selectedProfile.id, checkPin)
      if (result.success) {
        sessionStorage.setItem(`profileAuth_${selectedProfile.id}`, "true")
        window.location.reload()
      } else {
        setError("Incorrect PIN. Try again.")
        setPin("")
      }
    } catch {
      setError("Something went wrong.")
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

  if (mode === "login" || mode === "signup") {
    const isLogin = mode === "login"
    return (
      <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
        <div className="w-full max-w-sm animate-pin-slide-up pin-gate-card rounded-3xl p-8 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center text-3xl shadow-lg shadow-primary/20">
              👤
            </div>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Log in to manage your finances" : "Sign up to get started"}
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full p-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button
              onClick={() => handleAuth(isLogin ? "login" : "signup")}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "..." : (isLogin ? "Log In" : "Sign Up")}
            </button>
            <button
              onClick={() => { setMode(isLogin ? "signup" : "login"); setError("") }}
              className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center py-1"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground rounded-full">Or</span>
              </div>
            </div>
            
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 disabled:opacity-50 border border-border"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === "select-profile") {
    return (
      <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
        <div className="w-full max-w-sm animate-pin-slide-up pin-gate-card rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Who's tracking?</h1>
            <p className="text-sm text-muted-foreground">Select a profile to continue</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {profiles.map((prof) => (
              <button
                key={prof.id}
                onClick={() => handleSelectProfile(prof)}
                disabled={loading}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl mb-2">
                  {prof.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium">{prof.name}</span>
                {prof.pin && <span className="text-xs text-muted-foreground mt-1">🔒 PIN</span>}
              </button>
            ))}
            <button
              onClick={() => { setMode("create-profile"); setStep("enter"); setPin(""); setError("") }}
              disabled={loading}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2">
                +
              </div>
              <span className="text-sm font-medium">New Profile</span>
            </button>
          </div>
          
          <button
            onClick={async () => {
              await logout()
              window.location.reload()
            }}
            className="w-full text-sm text-muted-foreground hover:text-destructive transition-colors text-center py-2 mt-4"
          >
            Log Out
          </button>
        </div>
      </div>
    )
  }

  // mode === "create-profile" OR "enter-pin"
  const isCreate = mode === "create-profile"
  const currentPin = step === "confirm" ? confirmPin : pin
  const setCurrentPin = step === "confirm" ? setConfirmPin : setPin
  const handlePinAction = isCreate ? handleCreateProfile : handleEnterPin

  const modeTitle = isCreate
    ? step === "enter" ? "Create Profile" : "Confirm Profile PIN"
    : `Unlock ${selectedProfile?.name}`

  const modeSubtitle = isCreate
    ? step === "enter"
      ? "Enter a name, and optionally a 4-digit PIN"
      : "Re-enter your PIN to confirm"
    : "Enter your 4-digit PIN to access this profile"

  return (
    <div className="min-h-screen flex items-center justify-center pin-gate-bg p-4">
      <div className="w-full max-w-sm animate-pin-slide-up pin-gate-card rounded-3xl p-8 space-y-6">
        
        {isCreate && step === "enter" && (
          <div className="space-y-2 mb-4">
            <input
              type="text"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile Name (e.g. Personal)"
              className="w-full p-3 rounded-xl bg-secondary/60 border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-center font-medium"
            />
          </div>
        )}

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{modeTitle}</h1>
          <p className="text-sm text-muted-foreground">{modeSubtitle}</p>
        </div>

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

        {error && <p className="text-sm text-destructive text-center animate-shake font-medium">{error}</p>}
        {loading && <div className="flex justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}

        <div className="flex flex-col gap-2 pt-2">
          {isCreate && step === "enter" && currentPin.length === 0 && (
            <button
              onClick={() => handleCreateProfile()}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
            >
              Skip PIN & Create
            </button>
          )}
          
          <button
            onClick={() => {
              if (isCreate && step === "confirm") {
                setStep("enter")
                setPin("")
                setConfirmPin("")
              } else {
                setMode("select-profile")
                setPin("")
                setError("")
              }
            }}
            disabled={loading}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}
