"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Sparkles } from "lucide-react";
import { useThemeLabels } from "@/hooks/useThemeLabels";

const focusPrompts = [
  {
    title: "Rozpracuj ostatnie dowody",
    detail: "Znajdź błąd w solverskim kroku i zanotuj poprawkę.",
  },
  {
    title: "Praktyka kodowania",
    detail: "Zamień jedną funkcję na bardziej funkcjonalny zapis.",
  },
  {
    title: "Szybki powtórka z algebry",
    detail: "Wykonaj 3 zadania na przekształcenia macierzy.",
  },
];

export function MorningBriefingCard() {
  const { isCyber } = useThemeLabels();
  const userDetails = useQuery(api.users.getUserDetails);

  const [todayLabel] = useState(() => {
    const now = new Date();
    return new Intl.DateTimeFormat("pl-PL", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now);
  });

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 5) return "Przed świtem";
    if (hour < 12) return "Dzień dobry";
    if (hour < 17) return "Południowa sesja";
    return "Wieczorne przemyślenia";
  });

  const [focusPrompt] = useState(() => {
    return focusPrompts[Math.floor(Math.random() * focusPrompts.length)];
  });

  const streak = userDetails?.streak ?? 0;
  const xp = userDetails?.xp ?? 0;
  const monthlyGenerations = userDetails?.monthlyGenerations ?? 0;
  const generationGoal = 7;
  const progressPercent = Math.min(100, Math.round((monthlyGenerations / generationGoal) * 100));
  const formatter = new Intl.NumberFormat("pl-PL");

  return (
    <section
      id="morning-briefing"
      tabIndex={-1}
      aria-label="Morning briefing"
      className="max-w-5xl mx-auto w-full mb-12"
    >
      <div
        className={`card-premium relative overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-xl ${
          isCyber ? "ring-1 ring-[var(--border)]" : ""
        }`}
      >
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[var(--primary)]/15 text-[var(--primary)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
                {isCyber ? "MORNING_BRIEFING" : "Morning Briefing"}
              </p>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                {greeting}, {todayLabel}
              </h2>
            </div>
          </div>

          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {isCyber
              ? "Podpowiadamy Możliwości, które warto zrealizować przed kolejnym resetem."
              : "Podsumowanie dnia to szybki przegląd postępów i celów na najbliższe godziny."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.2em]">Streak</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{streak} dni</p>
              <p className="text-[var(--text-muted)] text-xs">Trwa w pełnym rytmie</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.2em]">XP</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{formatter.format(xp)}</p>
              <p className="text-[var(--text-muted)] text-xs">Zebrane punkty doświadczenia</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] p-4 text-center">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.2em]">Focus</p>
              <p className="text-xl font-bold text-[var(--foreground)]">{focusPrompt.title}</p>
              <p className="text-[var(--text-muted)] text-xs">{focusPrompt.detail}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Mission progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Link href="/learn" className="btn-premium px-6 py-3 text-sm font-semibold">
              Przejdź do planu
            </Link>
            <span className="text-xs text-[var(--text-muted)]">
              {isCyber
                ? "Zasada: Szybkie decyzje. Skanuj poranne dane."
                : "Wybierz dwa kluczowe kroki i wykonaj je jeszcze dziś."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
