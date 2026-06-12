"use client";

import { useState, useRef, useEffect } from "react";
import { updateDevicePin } from "@/lib/actions/device-actions";
import { getDeviceId, setStoredPin } from "@/lib/device";

type Step = "idle" | "current" | "new" | "confirm";

export function ChangePinForm() {
  const [step, setStep] = useState<Step>("idle");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== "idle") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  function reset() {
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
      // Compare new and confirm
      if (newPin !== completedPin) {
        setError("PINs don't match. Try again.");
        setStep("new");
        setNewPin("");
        setConfirmPin("");
        return;
      }

      // Submit the change
      setLoading(true);
      setError("");
      const deviceId = getDeviceId();
      if (!deviceId) {
        setError("Device not found. Please reload.");
        setLoading(false);
        return;
      }

      try {
        const result = await updateDevicePin(deviceId, currentPin, newPin);
        if (result.success) {
          setStoredPin(newPin);
          setSuccess("PIN changed successfully!");
          reset();
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

  const stepLabels: Record<Exclude<Step, "idle">, { title: string; desc: string }> = {
    current: { title: "Enter Current PIN", desc: "Verify your identity with your current 4-digit PIN" },
    new: { title: "Enter New PIN", desc: "Choose a new 4-digit PIN" },
    confirm: { title: "Confirm New PIN", desc: "Re-enter your new PIN to confirm" },
  };

  return (
    <div className="bg-card text-card-foreground border border-border p-6 rounded-2xl shadow-sm max-w-xl">
      <div className="mb-6">
        <h3 className="text-lg font-bold">Security</h3>
        <p className="text-sm text-muted-foreground">
          Change your 4-digit passcode to keep your data secure.
        </p>
      </div>

      {step === "idle" ? (
        <div className="space-y-4">
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-income/10 text-income text-sm font-medium">
              <span>✅</span>
              {success}
            </div>
          )}
          <button
            onClick={() => {
              setStep("current");
              setSuccess("");
            }}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-bold py-3 px-6 rounded-xl transition w-full sm:w-auto shadow-sm tracking-wide"
          >
            🔑 Change Passcode
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {(["current", "new", "confirm"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? "bg-primary text-primary-foreground scale-110"
                      : ["current", "new", "confirm"].indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div className={`w-8 h-0.5 rounded ${
                    ["current", "new", "confirm"].indexOf(step) > i ? "bg-primary/40" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step label */}
          <div>
            <p className="text-sm font-semibold text-foreground">{stepLabels[step].title}</p>
            <p className="text-xs text-muted-foreground">{stepLabels[step].desc}</p>
          </div>

          {/* PIN dots */}
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  i < activePin.length
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
            value={activePin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setActivePin(val);
              setError("");
              if (val.length === 4) {
                setTimeout(() => handlePinComplete(val), 100);
              }
            }}
            className="sr-only"
            autoComplete="off"
          />

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 max-w-[200px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((key, i) => {
              if (key === null) return <div key={i} />;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (key === "del") {
                      setActivePin(activePin.slice(0, -1));
                      setError("");
                    } else {
                      if (activePin.length < 4) {
                        const next = activePin + String(key);
                        setActivePin(next);
                        setError("");
                        if (next.length === 4) {
                          setTimeout(() => handlePinComplete(next), 100);
                        }
                      }
                    }
                  }}
                  disabled={loading}
                  className="h-11 rounded-xl bg-secondary hover:bg-secondary/80 active:scale-95 transition-all text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  {key === "del" ? "⌫" : key}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Updating...
            </div>
          )}

          {/* Cancel */}
          <button
            onClick={reset}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← Cancel
          </button>
        </div>
      )}
    </div>
  );
}
