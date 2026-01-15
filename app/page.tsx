"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight, Cpu, Rocket, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useThemeLabels } from "@/hooks/useThemeLabels";

import { Header } from "@/components/Header";

export default function LandingPage() {
  const { getLabel, isCyber } = useThemeLabels();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 relative overflow-hidden"
      >
        <div className="max-w-5xl w-full text-center space-y-8 sm:space-y-10 relative z-10 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
                isCyber
                  ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30"
                  : "bg-[var(--primary)]/5 text-[var(--primary)] rounded-full"
              }`}
            >
              <Zap className="w-4 h-4" />
              {isCyber ? "NEXT_GEN_LEARNING_PROTOCOL" : "Nowoczesna nauka wspomagana AI"}
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter leading-tight text-[var(--foreground)]">
              {isCyber ? (
                <>
                  GENERYCZNY_PLAN
                  <br />
                  <span className="text-[var(--primary)]">NAUKI_AI</span>
                </>
              ) : (
                <>
                  Zapanuj nad
                  <br />
                  <span className="text-[var(--primary)] text-glow">Wiedzą</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed font-medium">
              {isCyber
                ? "// Załaduj dane. Uruchom algorytmy. Osiągnij dominację intelektualną."
                : "Prześlij swoje materiały w formacie PDF, a nasza sztuczna inteligencja przygotuje dla Ciebie spersonalizowaną ścieżkę nauki."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6 sm:pt-8"
          >
            <Link
              href="/create"
              className="btn-premium flex items-center justify-center gap-3 text-base sm:text-lg px-8 sm:px-10 py-4 sm:py-5"
            >
              <Sparkles className="w-6 h-6" />
              {getLabel("newPlan")}
            </Link>
            <Link
              href="/dashboard"
              className={`flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg font-bold transition-all ${
                isCyber
                  ? "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  : "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 rounded-[var(--radius)]"
              }`}
            >
              <ArrowRight className="w-6 h-6" />
              {getLabel("dashboard")}
            </Link>
          </motion.div>
        </div>

        {/* Visual Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_50%)] blur-[120px] opacity-20" />
        </div>
      </main>

      {/* Features Preview */}
      <section
        id="features"
        tabIndex={-1}
        aria-label="Key features"
        className="py-20 sm:py-24 px-4 sm:px-8 border-t border-[var(--border)] bg-[var(--surface)]/30"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {[
            {
              icon: Cpu,
              title: isCyber ? "AI_CORE_ANALYSIS" : "Głęboka Analiza",
              desc: isCyber
                ? "Zaawansowane modele LLM procesują dane wejściowe."
                : "Nasze algorytmy wyciągają najważniejsze wzory i twierdzenia z Twoich notatek.",
            },
            {
              icon: Rocket,
              title: isCyber ? "LINEAR_EVOLUTION" : "Ścieżka Postępu",
              desc: isCyber
                ? "Zoptymalizowany przepływ wiedzy w fazowych modułach."
                : "Nauka podzielona na logiczne etapy: od teorii, przez praktykę, aż po test końcowy.",
            },
            {
              icon: ShieldCheck,
              title: isCyber ? "VALIDATED_RESULTS" : "Gwarancja Sukcesu",
              desc: isCyber
                ? "Weryfikacja wiedzy przez systemy symulacyjne."
                : "Sprawdź swoje umiejętności w kontrolowanych warunkach przed prawdziwym egzaminem.",
            },
          ].map((f, i) => (
            <div key={i} className="card-premium space-y-4">
              <div
                className={`w-12 h-12 flex items-center justify-center ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl"}`}
              >
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="text-[var(--text-muted)] leading-relaxed text-sm font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
      <footer
        id="site-footer"
        tabIndex={-1}
        className="py-10 border-t border-[var(--border)] text-center text-[var(--text-muted)] text-sm font-mono"
      >
        &lt;!-- © 2026 LEARNING_PLATFORM // pcstyle --&gt;
      </footer>
    </div>
  );
}
