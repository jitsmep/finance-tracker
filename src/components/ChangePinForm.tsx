"use client";

import { useState } from "react";
import { updateProfilePin } from "@/lib/actions/auth-actions";
import { Shield, Lock, ChevronRight, CheckCircle2 } from "lucide-react";

type Step = "idle" | "current" | "new" | "confirm";

function PinDots({ count, total = 4 }: { count: number; total?: number }) {
  return (
    <div className="flex gap-3 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
            i < count
              ? "bg-primary border-primary scale-125 shadow-md shadow-primary/30"
              : "border-border"
          }`}
        />
      ))}
    </div>
  );
}

function PinNumpad({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <PinDots count={value.length} />
      <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key, i) => {
          if (key === null) return <div key={i} />;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (key === "del") {
                  onChange(value.slice(0, -1));
                } else {
                  if (value.length < 4) {
                    const next = value + String(key);
                    onChange(next);
                    if (next.length === 4) {
                      setTimeout(() => onComplete(next), 80);
                    }
                  }
                }
              }}
              disabled={disabled}
              className="h-12 rounded-xl bg-secondary/70 hover:bg-secondary active:scale-90 transition-all text-base font-bold text-foreground disabled:opacity-40 border border-border/50"
            >
              {key === "del" ? "⌫" : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ChangePinForm() {
  const [step, setStep] = useState<Step>("idle");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function resetAll() {
    setStep("idle");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  }

  function getActivePin() {
    if (step === "current") return currentPin;
    if (step === "new") return newPin;
    if (step === "confirm") return confirmPin;
    return "";
  }

  function setActivePin(val: string) {
    if (step === "current") setCurrentPin(val);
    else if (step === "new") setNewPin(val);
    else if (step === "confirm") setConfirmPin(val);
  }

  async function handlePinComplete(completedPin: string) {
    if (step === "current") {
      setCurrentPin(completedPin);
      setStep("new");
      setNewPin("");
      setError("");
    } else if (step === "new") {
      setNewPin(completedPin);
      setStep("confirm");
      setConfirmPin("");
      setError("");
    } else if (step === "confirm") {
      if (newPin !== completedPin) {
        setError("PINs don't match. Try again.");
        setStep("new");
        setNewPin("");
        setConfirmPin("");
        return;
      }
      setLoading(true);
      setError("");
      
      try {
        const result = await updateProfilePin(currentPin, newPin);
        if (result.success) {
          setSuccess("Profile PIN changed successfully!");
          resetAll();
          setTimeout(() => setSuccess(""), 4000);
        } else {
          setError(result.error || "Failed to change PIN.");
          setStep("current");
          setCurrentPin("");
          setNewPin("");
          setConfirmPin("");
        }
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    }
  }

  const activePin = getActivePin();

  const stepLabels: Record<string, { title: string; desc: string }> = {
    current: { title: "Enter Current PIN", desc: "Verify your identity with your current 4-digit PIN" },
    new: { title: "Enter New PIN", desc: "Choose a new 4-digit PIN" },
    confirm: { title: "Confirm New PIN", desc: "Re-enter your new PIN to confirm" },
  };

  return (
    <div className="space-y-4">
      {/* ── SECURITY SECTION CARD ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Security</h3>
            <p className="text-xs text-muted-foreground">Manage your profile PIN</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {step === "idle" ? (
            <>
              {/* ── CHANGE PASSCODE BUTTON ── */}
              <button
                onClick={() => { setStep("current"); setCurrentPin(""); setError(""); }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border hover:border-primary/30 hover:bg-secondary/70 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-base">🔑</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Change Profile PIN</p>
                    <p className="text-xs text-muted-foreground">Update your 4-digit PIN</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </>
          ) : (
            // ── PIN ENTRY FLOW ──
            <div className="space-y-5">
              <div className="flex items-center gap-2 justify-center">
                {(["current", "new", "confirm"] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step === s
                          ? "bg-primary text-primary-foreground scale-110 shadow-md shadow-primary/30"
                          : ["current", "new", "confirm"].indexOf(step) > i
                          ? "bg-primary/25 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {i < 2 && (
                      <div className={`w-8 h-0.5 rounded ${["current", "new", "confirm"].indexOf(step) > i ? "bg-primary/40" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{stepLabels[step]?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stepLabels[step]?.desc}</p>
              </div>

              <PinNumpad
                value={activePin}
                onChange={(v) => { setActivePin(v); setError(""); }}
                onComplete={handlePinComplete}
                disabled={loading}
              />

              {error && <p className="text-sm text-destructive text-center font-medium animate-shake">{error}</p>}

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              )}

              <button
                onClick={resetAll}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition py-2"
              >
                ← Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
