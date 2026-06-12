"use client";

import { useState, useRef, useEffect } from "react";
import { updateDevicePin } from "@/lib/actions/device-actions";
import {
  getDeviceId,
  setStoredPin,
  isPasscodeEnabled,
  setPasscodeEnabled,
  getSecurityQuestion,
  getSecurityAnswer,
  setSecurityQuestion,
  setSecurityAnswer,
  verifySecurityAnswer,
  SECURITY_QUESTIONS,
} from "@/lib/device";
import { Shield, Lock, ChevronRight, CheckCircle2, Eye, EyeOff } from "lucide-react";

type Step = "idle" | "current" | "new" | "confirm";
type SubMode = "change-pin" | "disable-pin" | "change-question";

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
  const [subMode, setSubMode] = useState<SubMode>("change-pin");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Passcode enabled state (from localStorage)
  const [passcodeOn, setPasscodeOn] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Security question state
  const [showQuestionEdit, setShowQuestionEdit] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [newAnswer, setNewAnswer] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [questionSuccess, setQuestionSuccess] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  // For disable-pin flow: verify current PIN first
  const [disableVerifyPin, setDisableVerifyPin] = useState("");

  useEffect(() => {
    setPasscodeOn(isPasscodeEnabled());
    const q = getSecurityQuestion();
    setSelectedQuestion(q || SECURITY_QUESTIONS[0]);
    setMounted(true);
  }, []);

  function resetAll() {
    setStep("idle");
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    setDisableVerifyPin("");
    setSubMode("change-pin");
  }

  function getActivePin() {
    if (subMode === "disable-pin") return disableVerifyPin;
    if (step === "current") return currentPin;
    if (step === "new") return newPin;
    if (step === "confirm") return confirmPin;
    return "";
  }

  function setActivePin(val: string) {
    if (subMode === "disable-pin") { setDisableVerifyPin(val); return; }
    if (step === "current") setCurrentPin(val);
    else if (step === "new") setNewPin(val);
    else if (step === "confirm") setConfirmPin(val);
  }

  async function handlePinComplete(completedPin: string) {
    if (subMode === "disable-pin") {
      // Verify current PIN then disable
      setLoading(true);
      const deviceId = getDeviceId();
      if (!deviceId) { setError("Device not found."); setLoading(false); return; }
      try {
        const { updateDevicePin: _unused, ...rest } = await import("@/lib/actions/device-actions");
        const { verifyDevicePin } = await import("@/lib/actions/device-actions");
        const { success } = await verifyDevicePin(deviceId, completedPin);
        if (success) {
          setPasscodeEnabled(false);
          setPasscodeOn(false);
          setSuccess("Passcode disabled successfully.");
          resetAll();
          setTimeout(() => setSuccess(""), 4000);
        } else {
          setError("Incorrect PIN. Try again.");
          setDisableVerifyPin("");
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

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
      const deviceId = getDeviceId();
      if (!deviceId) { setError("Device not found. Please reload."); setLoading(false); return; }
      try {
        const result = await updateDevicePin(deviceId, currentPin, newPin);
        if (result.success) {
          setStoredPin(newPin);
          setSuccess("Passcode changed successfully!");
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

  function handleSaveSecurityQuestion() {
    if (!newAnswer.trim() || newAnswer.trim().length < 2) {
      setQuestionError("Please enter a valid answer (at least 2 characters).");
      return;
    }
    setSecurityQuestion(selectedQuestion);
    setSecurityAnswer(newAnswer);
    setQuestionSuccess("Security question updated!");
    setShowQuestionEdit(false);
    setNewAnswer("");
    setQuestionError("");
    setTimeout(() => setQuestionSuccess(""), 4000);
  }

  function handleTogglePasscode() {
    if (passcodeOn) {
      // Disabling — need to verify PIN first
      setSubMode("disable-pin");
      setDisableVerifyPin("");
      setError("");
      setStep("current"); // reuse "current" step label
    } else {
      // Enabling — just flip the flag (PIN already exists)
      setPasscodeEnabled(true);
      setPasscodeOn(true);
      setSuccess("Passcode enabled.");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  if (!mounted) return <div className="h-48 rounded-2xl bg-secondary/30 animate-pulse" />;

  const activePin = getActivePin();
  const storedQuestion = getSecurityQuestion();
  const hasSecurityQuestion = !!storedQuestion && !!getSecurityAnswer();

  const stepLabels: Record<string, { title: string; desc: string }> = {
    current: subMode === "disable-pin"
      ? { title: "Verify Your PIN", desc: "Enter your current PIN to disable passcode" }
      : { title: "Enter Current PIN", desc: "Verify your identity with your current 4-digit PIN" },
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
            <p className="text-xs text-muted-foreground">Manage your PIN & recovery</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Success message */}
          {success && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {step === "idle" ? (
            <>
              {/* ── PASSCODE TOGGLE ── */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${passcodeOn ? "bg-primary/15" : "bg-muted"}`}>
                    <Lock className={`w-4 h-4 ${passcodeOn ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Passcode Lock</p>
                    <p className="text-xs text-muted-foreground">{passcodeOn ? "App is locked on start" : "No lock on start"}</p>
                  </div>
                </div>
                {/* Toggle Switch */}
                <button
                  onClick={handleTogglePasscode}
                  aria-label={passcodeOn ? "Disable passcode" : "Enable passcode"}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${passcodeOn ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${passcodeOn ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {/* ── CHANGE PASSCODE BUTTON ── */}
              <button
                onClick={() => { setSubMode("change-pin"); setStep("current"); setCurrentPin(""); setError(""); }}
                disabled={!passcodeOn}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border hover:border-primary/30 hover:bg-secondary/70 disabled:opacity-40 disabled:pointer-events-none transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-base">🔑</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">Change Passcode</p>
                    <p className="text-xs text-muted-foreground">Update your 4-digit PIN</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* ── SECURITY QUESTION ── */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-secondary/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <span className="text-base">🛡️</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Recovery Question</p>
                      <p className="text-xs text-muted-foreground">
                        {hasSecurityQuestion ? "Question is set" : "Not configured"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowQuestionEdit(!showQuestionEdit)}
                    className="text-xs font-semibold text-primary hover:underline px-2 py-1 rounded-lg hover:bg-primary/10 transition"
                  >
                    {showQuestionEdit ? "Cancel" : hasSecurityQuestion ? "Change" : "Set Up"}
                  </button>
                </div>

                {showQuestionEdit && (
                  <div className="p-4 space-y-3 border-t border-border bg-background/50 animate-fade-in">
                    {questionSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm text-primary font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        {questionSuccess}
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Security Question</label>
                      <select
                        value={selectedQuestion}
                        onChange={(e) => setSelectedQuestion(e.target.value)}
                        className="mt-1.5 w-full p-2.5 text-sm rounded-xl bg-secondary/60 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                      >
                        {SECURITY_QUESTIONS.map((q) => (
                          <option key={q} value={q}>{q}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Answer</label>
                      <div className="relative mt-1.5">
                        <input
                          type={showAnswer ? "text" : "password"}
                          value={newAnswer}
                          onChange={(e) => { setNewAnswer(e.target.value); setQuestionError(""); }}
                          placeholder="Your answer..."
                          className="w-full p-2.5 pr-10 text-sm rounded-xl bg-secondary/60 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAnswer(!showAnswer)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {questionError && <p className="text-xs text-destructive mt-1">{questionError}</p>}
                    </div>
                    <button
                      onClick={handleSaveSecurityQuestion}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      Save Question
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // ── PIN ENTRY FLOW ──
            <div className="space-y-5">
              {/* Step progress */}
              {subMode === "change-pin" && (
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
              )}

              {/* Step label */}
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{stepLabels[step]?.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stepLabels[step]?.desc}</p>
              </div>

              {/* Pin numpad */}
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
