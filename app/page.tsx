
"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useConvexAuth } from "convex/react";

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-indigo-600 rounded-lg group-hover:rotate-12 transition-transform duration-300">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            MathPrep AI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-gray-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Cechy</a>
          <a href="#" className="hover:text-white transition-colors">Cennik</a>
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="btn-premium py-2 px-5 text-sm"
          >
            {isLoading ? "..." : isAuthenticated ? "Dashboard" : "Rozpocznij"}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-40 text-center relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Zasilane przez Gemini 1.5 Flash
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto">
            Twoja Osobista Maszyna do <br />
            <span className="text-indigo-500">Nauki Matematyki</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Prześlij swój podręcznik lub notatki w formacie PDF i poczekaj chwilę.
            Nasz system wygeneruje dla Ciebie obszerny, trzystopniowy plan nauki,
            od teorii po próbny egzamin.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/dashboard" className="btn-premium group w-full sm:w-auto">
              Zacznij Generować
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-3 rounded-xl border border-gray-800 text-gray-300 font-semibold hover:bg-gray-800/50 transition-all w-full sm:w-auto">
              Zobacz Przykład
            </button>
          </div>
        </motion.div>

        {/* Feature Preview Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-32 w-full px-4">
          {[
            {
              icon: BookOpen,
              title: "Obszerna Teoria",
              desc: "Głęboka analiza materiałów źródłowych i ekstrakcja wszystkich wzorów."
            },
            {
              icon: Sparkles,
              title: "Zadania z Przewodnikiem",
              desc: "Rozwiązania krok po kroku, które nauczą Cię jak myśleć, a nie tylko liczyć."
            },
            {
              icon: Brain,
              title: "Egzaminy Próbne",
              desc: "Generujemy testy sprawdzające wiedzę, bazując dokładnie na Twoich materiałach."
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-premium text-left"
            >
              <div className="p-3 bg-indigo-500/10 rounded-lg w-fit mb-4">
                <f.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="py-10 border-t border-gray-900/50 text-center text-gray-500 text-sm">
        © 2026 MathPrep AI. Zbudowano z pasją przez pcstyle.
      </footer>
    </div>
  );
}
