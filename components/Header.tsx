"use client";

import { useConvexAuth } from "convex/react";
import { Brain, Settings, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useThemeLabels } from "@/hooks/useThemeLabels";

export const Header = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { getLabel, isCyber } = useThemeLabels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderAuthActions = (className: string, iconClassName?: string) => {
    if (isLoading) {
      return (
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      );
    }

    if (isAuthenticated) {
      return (
        <div className={className}>
          <Link
            href="/settings"
            className={`p-2 transition-all ${
              isCyber
                ? "border border-[var(--border)] hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
                : "hover:bg-[var(--border)] rounded-full"
            }`}
            title={getLabel("settings")}
          >
            <Settings className="w-5 h-5" />
          </Link>
          <a
            href="/logout"
            className={`flex items-center gap-2 px-5 py-2 transition-all text-xs font-bold ${
              isCyber
                ? "border border-[var(--border)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-500"
                : "bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-full"
            } ${iconClassName || ""}`}
          >
            {isCyber ? "[ LOGOUT ]" : <LogOut className="w-4 h-4" />}
            {!isCyber && "Wyloguj"}
          </a>
        </div>
      );
    }

    return (
      <div className={className}>
        <a
          href="/login"
          className="hover:text-[var(--primary)] transition-colors text-sm font-semibold"
        >
          {getLabel("login")}
        </a>
        <a href="/sign-up" className="btn-premium py-2.5 px-6 text-sm">
          {getLabel("register")}
        </a>
      </div>
    );
  };

  return (
    <nav className="px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full relative z-50">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div
            className={`p-2 transition-all duration-300 ${
              isCyber
                ? "border border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:shadow-[0_0_20px_var(--primary)]"
                : "bg-[var(--primary)] text-white rounded-[var(--radius)]"
            }`}
          >
            <Brain
              className={`w-7 h-7 ${isCyber ? "text-[var(--primary)] group-hover:text-black" : "text-white"}`}
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight">
            <span className="text-[var(--primary)]">Learning</span>
            <span className="text-[var(--foreground)]">Platform</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[var(--foreground)] font-medium">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="hover:text-[var(--primary)] transition-colors text-sm font-semibold"
            >
              {getLabel("dashboard")}
            </Link>
            <Link
              href="/learn"
              className="hover:text-[var(--primary)] transition-colors text-sm font-semibold"
            >
              Learn
            </Link>
            <Link
              href="/solver"
              className="hover:text-[var(--primary)] transition-colors text-sm font-semibold"
            >
              Solver
            </Link>
          </div>
          {renderAuthActions("flex items-center gap-4")}
        </div>

        <button
          type="button"
          className="md:hidden flex items-center justify-center w-10 h-10 border border-[var(--border)] rounded-full"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden mt-6 space-y-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-col gap-4 text-sm font-semibold">
            <Link
              href="/dashboard"
              className="hover:text-[var(--primary)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {getLabel("dashboard")}
            </Link>
            <Link
              href="/learn"
              className="hover:text-[var(--primary)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Learn
            </Link>
            <Link
              href="/solver"
              className="hover:text-[var(--primary)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Solver
            </Link>
          </div>
          {renderAuthActions("flex flex-col gap-3", "justify-center")}
        </div>
      )}
    </nav>
  );
};
