
"use client";

import { useConvexAuth } from "convex/react";
import { Brain, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { useThemeLabels } from "@/hooks/useThemeLabels";

export const Header = () => {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const { getLabel, isCyber } = useThemeLabels();

    return (
        <nav className="flex items-center justify-between px-8 py-8 max-w-7xl mx-auto w-full relative z-50">
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
                <div className={`p-2 transition-all duration-300 ${isCyber
                        ? "border border-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:shadow-[0_0_20px_var(--primary)]"
                        : "bg-[var(--primary)] text-white rounded-[var(--radius)]"
                    }`}>
                    <Brain className={`w-7 h-7 ${isCyber ? "text-[var(--primary)] group-hover:text-black" : "text-white"}`} />
                </div>
                <span className="text-2xl font-bold tracking-tight">
                    <span className="text-[var(--primary)]">Math</span>
                    <span className="text-[var(--foreground)]">Prep</span>
                </span>
            </Link>

            <div className="flex items-center gap-8 text-[var(--foreground)] font-medium">
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/dashboard" className="hover:text-[var(--primary)] transition-colors text-sm font-semibold">
                        {getLabel("dashboard")}
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {isLoading ? (
                        <div className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
                    ) : isAuthenticated ? (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/settings"
                                className={`p-2 transition-all ${isCyber
                                        ? "border border-[var(--border)] hover:border-[var(--secondary)] hover:text-[var(--secondary)]"
                                        : "hover:bg-[var(--border)] rounded-full"
                                    }`}
                                title={getLabel("settings")}
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/logout"
                                className={`flex items-center gap-2 px-5 py-2 transition-all text-xs font-bold ${isCyber
                                        ? "border border-[var(--border)] text-[var(--text-muted)] hover:border-red-500 hover:text-red-500"
                                        : "bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded-full"
                                    }`}
                            >
                                {isCyber ? "[ LOGOUT ]" : <LogOut className="w-4 h-4" />}
                                {!isCyber && "Wyloguj"}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="hover:text-[var(--primary)] transition-colors text-sm font-semibold"
                            >
                                {getLabel("login")}
                            </Link>
                            <Link
                                href="/register"
                                className="btn-premium py-2.5 px-6 text-sm"
                            >
                                {getLabel("register")}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};
