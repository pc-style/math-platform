"use client";

import { Brain, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useThemeLabels } from "@/hooks/useThemeLabels";
import { AuthButton } from "@/components/AuthButton";

export const Header = () => {
  const { getLabel, isCyber } = useThemeLabels();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderAuthActions = (className: string) => {
    return (
      <div className={className}>
        <AuthButton />
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
            <span className="text-[var(--primary)]">Math</span>
            <span className="text-[var(--foreground)]">Prep</span>
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
              href="/solver"
              className="hover:text-[var(--primary)] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Solver
            </Link>
          </div>
          {renderAuthActions("flex flex-col gap-3")}
        </div>
      )}
    </nav>
  );
};
