"use client";

import { useState } from "react";
import { updateUserEmail } from "@/lib/actions/auth-actions";
import { Mail, ChevronRight, CheckCircle2 } from "lucide-react";

export function ChangeEmailForm({ initialEmail }: { initialEmail: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(initialEmail || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const result = await updateUserEmail(email);
      if (result.success) {
        setSuccess("Email updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(result.error || "Failed to update email.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">Account</h3>
          <p className="text-xs text-muted-foreground">Manage your email address</p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {success && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-sm font-medium text-primary animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {!isEditing ? (
          <button
            onClick={() => { setIsEditing(true); setError(""); }}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-secondary/40 border border-border hover:border-primary/30 hover:bg-secondary/70 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-base">📧</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Update Email Address</p>
                <p className="text-xs text-muted-foreground">{initialEmail || "No email set"}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">New Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="e.g. you@example.com"
                className="w-full p-3 rounded-xl bg-secondary/40 border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                required
              />
            </div>
            
            {error && <p className="text-sm text-destructive font-medium animate-shake">{error}</p>}
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEmail(initialEmail || ""); setError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-secondary text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading ? "Saving..." : "Save Email"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
