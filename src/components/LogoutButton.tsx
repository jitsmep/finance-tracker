"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth-actions";

export function LogoutButton() {
  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive/20 active:scale-[0.98] transition-all"
    >
      <LogOut className="w-4 h-4" />
      Log Out
    </button>
  );
}
