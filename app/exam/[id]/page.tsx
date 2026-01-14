
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, BookOpen, PenTool, Award, ChevronDown,
    ChevronUp, CheckCircle2, Circle, ArrowLeft,
    Sparkles, Lightbulb, GraduationCap, ChevronRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";
import { Id } from "../../../convex/_generated/dataModel";

export default function ExamStudyView() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as Id<"exams">;
    const exam = useQuery(api.exams.getExam, { id: examId });
    const { getLabel, isCyber } = useThemeLabels();

    const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
    const [revealedSolutions, setRevealedSolutions] = useState<Set<number>>(new Set());
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (exam) {
            console.log(`[ExamView] Załadowano projekt: ${exam.title}. Status: ${exam.status}`);
        }
    }, [exam]);

    const progress = useMemo(() => {
        if (!exam?.data) return 0;
        const total = exam.data.phase1_theory.length + exam.data.phase2_guided.length + exam.data.phase3_exam.length;
        return Math.round((completedSteps.size / total) * 100);
    }, [completedSteps, exam]);

    const toggleStep = (idx: number) => {
        const next = new Set(expandedSteps);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setExpandedSteps(next);
    };

    const toggleSolution = (idx: number) => {
        const next = new Set(revealedSolutions);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setRevealedSolutions(next);
    };

    const toggleCompletion = (phase: number, idx: number) => {
        const key = `${phase}-${idx}`;
        const next = new Set(completedSteps);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setCompletedSteps(next);
        console.log(`[ExamView] Zaktualizowano postęp. Łącznie ukończono: ${next.size} kroków.`);
    };

    if (exam === undefined) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!exam || exam.status === 'error') {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="max-w-xl mx-auto px-6 py-40 text-center">
                    <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl mb-8 border border-red-500/20">
                        <ArrowLeft className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2 uppercase">Wystąpił błąd</h2>
                        <p className="font-medium">{exam?.error || "Nie udało się załadować projektu."}</p>
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="btn-premium">
                        Wróć do dashboardu
                    </button>
                </div>
            </div>
        );
    }

    if (exam.status !== 'ready') {
        return (
            <div className="flex flex-col min-h-screen bg-[var(--background)]">
                <Header />
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-10 mb-10 ${isCyber ? "border-2 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_50px_var(--glow)]" : "bg-[var(--primary)]/5 text-[var(--primary)] rounded-[3rem] shadow-2xl"}`}
                    >
                        <Brain className={`w-16 h-16 ${isCyber ? "animate-glitch" : "animate-pulse"}`} />
                    </motion.div>
                    <h2 className="text-4xl font-extrabold mb-4 tracking-tight">{getLabel("generating")}</h2>
                    <p className="text-[var(--text-muted)] max-w-md mb-12 text-lg font-medium leading-relaxed">
                        Nasza sztuczna inteligencja analizuje Twoje materiały, wyciąga wzory i tworzy plan. To może potrwać do minuty.
                    </p>
                    <div className="w-64 h-2 bg-[var(--border)] rounded-full overflow-hidden mb-12">
                        <motion.div
                            className="h-full bg-[var(--primary)] shadow-[0_0_15px_var(--glow)]"
                            animate={{ width: ["0%", "40%", "70%", "95%"] }}
                            transition={{ duration: 45, ease: "easeInOut" }}
                        />
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-[var(--primary)] font-bold hover:underline underline-offset-8">
                        <ArrowLeft className="w-5 h-5" /> Wróć do projektów
                    </button>
                </div>
            </div>
        );
    }

    const { phase1_theory, phase2_guided, phase3_exam } = exam.data!;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <div className="flex-1 max-w-6xl mx-auto px-8 py-12 w-full">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className={`p-2 transition-all ${isCyber ? "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl hover:bg-[var(--primary)]/20 shadow-sm"}`}
                                title="Powrót"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-4xl font-extrabold tracking-tight line-clamp-1">{exam.title}</h1>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                <GraduationCap className="w-4 h-4" />
                                Model: Gemini 3 Flash Preview
                            </span>
                            <span className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] uppercase tracking-wider">
                                <Sparkles className="w-4 h-4" />
                                {progress === 100 ? "Ukończono" : `Postęp: ${progress}%`}
                            </span>
                        </div>
                    </div>

                    <div className="w-full md:w-64 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-sm">
                        <div className="flex justify-between text-xs font-bold uppercase mb-2 tracking-widest text-[var(--text-muted)]">
                            <span>Opanowanych:</span>
                            <span>{completedSteps.size} / {phase1_theory.length + phase2_guided.length + phase3_exam.length}</span>
                        </div>
                        <div className="h-4 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--border)]">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Phase Selection Tabs */}
                <div className="flex flex-wrap gap-4 mb-12">
                    {[
                        { id: 1 as const, icon: BookOpen, label: getLabel("theory"), color: "text-blue-500" },
                        { id: 2 as const, icon: PenTool, label: getLabel("practice"), color: "text-purple-500" },
                        { id: 3 as const, icon: Award, label: getLabel("exam"), color: "text-amber-500" }
                    ].map((phase) => (
                        <button
                            key={phase.id}
                            onClick={() => { setActivePhase(phase.id); setExpandedSteps(new Set([0])); }}
                            className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 p-5 transition-all duration-300 relative group overflow-hidden ${activePhase === phase.id
                                ? "bg-[var(--primary)] text-white shadow-xl translate-y-[-4px]"
                                : "bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)]/50"
                                } ${isCyber ? "" : "rounded-[1.5rem]"}`}
                        >
                            <phase.icon className={`w-6 h-6 ${activePhase === phase.id ? "text-white" : phase.color}`} />
                            <span className="font-extrabold tracking-tight">{phase.label}</span>
                            {activePhase === phase.id && (
                                <motion.div layoutId="phase-glow" className="absolute inset-0 bg-white/10" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Overlay */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {activePhase === 1 && (
                            <motion.div
                                key="theory-list"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {phase1_theory.map((item, idx) => (
                                    <div key={idx} className={`group ${isCyber ? "" : "rounded-3xl overflow-hidden shadow-sm"}`}>
                                        <div className={`p-6 flex items-center justify-between cursor-pointer transition-all ${expandedSteps.has(idx)
                                            ? "bg-[var(--primary)]/5 border-x border-t border-[var(--primary)]/20"
                                            : "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/50"
                                            }`} onClick={() => toggleStep(idx)}>
                                            <div className="flex items-center gap-6">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleCompletion(1, idx); }}
                                                    className="transition-transform active:scale-90"
                                                >
                                                    {completedSteps.has(`1-${idx}`)
                                                        ? <CheckCircle2 className="w-8 h-8 text-green-500 fill-green-500/10" />
                                                        : <Circle className="w-8 h-8 text-[var(--border)] group-hover:text-[var(--primary)]/50" />
                                                    }
                                                </button>
                                                <h3 className="text-xl md:text-2xl font-bold tracking-tight">{item.topic}</h3>
                                            </div>
                                            {expandedSteps.has(idx) ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                        </div>
                                        {expandedSteps.has(idx) && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: 'auto' }}
                                                className="bg-[var(--surface)] border-x border-b border-[var(--primary)]/20 p-8 prose prose-invert max-w-none"
                                            >
                                                <div className="text-[var(--foreground)] leading-relaxed text-lg whitespace-pre-wrap font-medium">
                                                    {item.content}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activePhase === 2 && (
                            <motion.div
                                key="practice-list"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                {phase2_guided.map((item, idx) => (
                                    <div key={idx} className={`card-premium p-0 overflow-hidden ${isCyber ? "" : "rounded-[2.5rem]"}`}>
                                        <div className="p-8 border-b border-[var(--border)] bg-[var(--primary)]/5 flex items-start gap-6">
                                            <button
                                                onClick={() => toggleCompletion(2, idx)}
                                                className="mt-1"
                                            >
                                                {completedSteps.has(`2-${idx}`)
                                                    ? <CheckCircle2 className="w-8 h-8 text-green-500" />
                                                    : <Circle className="w-8 h-8 text-[var(--border)]" />
                                                }
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[var(--primary)] text-xs font-bold font-mono tracking-widest uppercase bg-[var(--primary)]/10 px-3 py-1 rounded-full">Zadanie {idx + 1}</span>
                                                </div>
                                                <h3 className="text-2xl font-bold leading-tight mb-4">{item.question}</h3>
                                            </div>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-4">
                                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4" /> Przewodnik krok po kroku:
                                                </p>
                                                {item.steps.map((step, sidx) => (
                                                    <div key={sidx} className="flex gap-4 p-4 bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl">
                                                        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[var(--primary)] text-white font-bold rounded-lg text-sm">{sidx + 1}</span>
                                                        <p className="text-[var(--foreground)] font-medium">{step}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-6">
                                                <button
                                                    onClick={() => toggleSolution(idx)}
                                                    className={`w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed font-bold transition-all ${revealedSolutions.has(idx)
                                                        ? "border-green-500/50 bg-green-500/5 text-green-600"
                                                        : "border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/5"
                                                        } ${isCyber ? "" : "rounded-2xl"}`}
                                                >
                                                    {revealedSolutions.has(idx) ? "UKRYJ ROZWIĄZANIE" : "POKAŻ OSTATECZNE ROZWIĄZANIE"}
                                                </button>
                                                {revealedSolutions.has(idx) && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="mt-6 p-8 bg-green-500/5 border border-green-500/20 rounded-3xl"
                                                    >
                                                        <p className="font-bold text-green-600 mb-2 uppercase text-xs tracking-widest">WYNIK KOŃCOWY:</p>
                                                        <p className="text-xl font-extrabold text-green-700">{item.solution}</p>
                                                        {item.tips && (
                                                            <div className="mt-6 pt-6 border-t border-green-500/10 italic text-green-600/80 text-sm font-medium">
                                                                Tip: {item.tips}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activePhase === 3 && (
                            <motion.div
                                key="exam-list"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                <div className="card-premium bg-amber-500/5 border-amber-500/20 p-10 mb-10 text-center">
                                    <Award className="w-16 h-16 text-amber-500 mx-auto mb-6" />
                                    <h2 className="text-3xl font-extrabold mb-4 font-sans">Egzamin Końcowy</h2>
                                    <p className="text-[var(--text-muted)] max-w-xl mx-auto font-medium text-lg">
                                        Czas na ostateczny test wiedzy. Rozwiąż zadania samodzielnie, a następnie sprawdź odpowiedzi.
                                    </p>
                                </div>
                                {phase3_exam.map((item, idx) => (
                                    <div key={idx} className={`card-premium p-8 group transition-all hover:ring-2 ring-amber-500/30 ${isCyber ? "" : "rounded-[2rem]"}`}>
                                        <div className="flex items-start gap-6 mb-8">
                                            <button
                                                onClick={() => toggleCompletion(3, idx)}
                                                className="mt-1"
                                            >
                                                {completedSteps.has(`3-${idx}`)
                                                    ? <CheckCircle2 className="w-8 h-8 text-green-500" />
                                                    : <Circle className="w-8 h-8 text-[var(--border)]" />
                                                }
                                            </button>
                                            <div>
                                                <p className="text-xs font-extrabold text-amber-600 tracking-widest uppercase mb-2">Pytanie {idx + 1}</p>
                                                <h3 className="text-2xl font-bold leading-tight">{item.question}</h3>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-[var(--border)]">
                                            <button
                                                onClick={() => toggleSolution(idx + 100)} // Offset to distinguish from Phase 2
                                                className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${revealedSolutions.has(idx + 100) ? "text-amber-600" : "text-[var(--text-muted)] hover:text-amber-500"
                                                    }`}
                                            >
                                                {revealedSolutions.has(idx + 100) ? "Ukryj odpowiedź" : "Sprawdź odpowiedź"}
                                                <ChevronRight className={`w-4 h-4 transition-transform ${revealedSolutions.has(idx + 100) ? "rotate-90" : ""}`} />
                                            </button>
                                            {revealedSolutions.has(idx + 100) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="mt-6 p-6 bg-white/[0.03] border border-amber-500/20 rounded-2xl"
                                                >
                                                    <p className="font-extrabold text-xl text-amber-700">{item.answer}</p>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Toast */}
            {progress === 100 && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white px-10 py-5 rounded-full shadow-2xl z-[100] flex items-center gap-4 border-2 border-white/20"
                >
                    <Award className="w-8 h-8" />
                    <div className="text-left">
                        <p className="font-extrabold text-lg leading-none">GRATULACJE!</p>
                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Ukończyłeś cały plan nauki!</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
