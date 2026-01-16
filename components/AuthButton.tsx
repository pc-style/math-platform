"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { LogIn, LogOut, User } from "lucide-react";

/**
 * Auth button component for math-platform
 * Uses theme variables for consistent styling
 */
export function AuthButton() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 animate-pulse" />;
  }

  if (!user) {
    return (
      <a
        href="https://auth.pcstyle.dev"
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] border border-[var(--primary)]/30 rounded-[var(--radius)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] transition-all"
      >
        <LogIn className="w-4 h-4" />
        Zaloguj
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
        <User className="w-4 h-4 text-[var(--primary)]" />
        <span className="hidden sm:inline max-w-32 truncate">{user.email}</span>
      </div>
      <a
        href="https://auth.pcstyle.dev/signout"
        className="flex items-center gap-2 px-2 py-1.5 text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
        title="Wyloguj"
      >
        <LogOut className="w-4 h-4" />
      </a>
    </div>
  );
}
