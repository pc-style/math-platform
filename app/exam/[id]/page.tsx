
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Lightbulb,
    Search,
    ChevronLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Brain,
    Home,
    MessageSquare,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function ExamStudyView() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as any;
    const exam = useQuery(api.exams.getExam, { id: examId });

    const [activePhase, setActivePhase] = useState(1);
    const [expandedExercises, setExpandedExercises] = useState<number[]>([]);
    const [revealedAnswers, setRevealedAnswers] = useState<number[]>([]);

    if (exam === undefined) return <div className="p-8">Loading...</div>;
    if (!exam) return <div className="p-8 text-center">Exam not found.</div>;
    if (exam.status !== 'ready') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
                <div className="p-6 bg-amber-500/10 rounded-full mb-6">
                    <Brain className="w-12 h-12 text-amber-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Przygotowujemy Twój plan...</h2>
                <p className="text-gray-400 max-w-sm mb-8">Nasza sztuczna inteligencja analizuje Twój dokument. To może potrwać do minuty.</p>
                <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-indigo-400 font-medium">
                    <ChevronLeft className="w-4 h-4" /> Wróć do dashboardu
                </button>
            </div>
        );
    }

    const data = exam.data!;

    const toggleExercise = (idx: number) => {
        setExpandedExercises(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    const toggleAnswer = (idx: number) => {
        setRevealedAnswers(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    return (
        <div className="flex h-screen bg-bg-dark text-text-main overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r border-gray-800/50 flex flex-col bg-gray-950/50 backdrop-blur-xl">
                <div className="p-6 border-b border-gray-800/50">
                    <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
                        <Home className="w-4 h-4" /> Dashboard
                    </Link>
                    <h1 className="text-xl font-bold truncate leading-tight mb-2">{exam.title}</h1>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Plan Nauki</div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-4">
                    {[
                        { id: 1, name: "Faza I: Teoria", icon: BookOpen, color: "text-blue-400" },
                        { id: 2, name: "Faza II: Ćwiczenia", icon: Lightbulb, color: "text-amber-400" },
                        { id: 3, name: "Faza III: Egzamin", icon: Search, color: "text-purple-400" },
                    ].map((phase) => (
                        <button
                            key={phase.id}
                            onClick={() => setActivePhase(phase.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${activePhase === phase.id
                                    ? 'bg-indigo-600/10 text-white shadow-sm border border-indigo-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                }`}
                        >
                            <phase.icon className={`w-5 h-5 ${activePhase === phase.id ? phase.color : 'text-gray-500'}`} />
                            {phase.name}
                        </button>
                    ))}
                </nav>

                <div className="p-6 mt-auto">
                    <div className="card-premium p-4 text-xs">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-500">Postęp</span>
                            <span className="text-indigo-400 font-bold">33%</span>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-1/3" />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto scroll-smooth bg-[#0a0f1d] relative">
                <div className="max-w-4xl mx-auto px-8 py-16">
                    <AnimatePresence mode="wait">
                        {activePhase === 1 && (
                            <motion.div
                                key="phase1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div>
                                    <h2 className="text-4xl font-extrabold mb-4">Przegląd Teorii</h2>
                                    <p className="text-lg text-gray-400">Przeanalizuj kluczowe zagadnienia wyodrębnione z Twoich materiałów.</p>
                                </div>

                                <div className="space-y-8">
                                    {data.phase1_theory.map((item, i) => (
                                        <div key={i} className="card-premium prose prose-invert max-w-none">
                                            <h3 className="text-2xl font-bold mb-4 text-indigo-100 flex items-center gap-3">
                                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 text-sm">{i + 1}</span>
                                                {item.topic}
                                            </h3>
                                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                {item.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-12">
                                    <button onClick={() => setActivePhase(2)} className="btn-premium group">
                                        Przejdź do Ćwiczeń <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 duration-300" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activePhase === 2 && (
                            <motion.div
                                key="phase2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div>
                                    <h2 className="text-4xl font-extrabold mb-4">Ćwiczenia z Przewodnikiem</h2>
                                    <p className="text-lg text-gray-400">Przećwicz teorię w praktyce dzięki szczegółowym rozwiązaniom.</p>
                                </div>

                                <div className="space-y-6">
                                    {data.phase2_guided.map((item, i) => (
                                        <div key={i} className="card-premium">
                                            <div
                                                className="flex items-start justify-between cursor-pointer"
                                                onClick={() => toggleExercise(i)}
                                            >
                                                <div className="flex-1 pr-8">
                                                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2 block">Zadanie {i + 1}</span>
                                                    <h4 className="text-xl font-bold mb-4 whitespace-pre-wrap">{item.question}</h4>
                                                </div>
                                                <div className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                    {expandedExercises.includes(i) ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedExercises.includes(i) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-8 mt-8 border-t border-gray-800/50 space-y-6">
                                                            <div className="space-y-4">
                                                                <h5 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4" /> Kroki rozwiązania
                                                                </h5>
                                                                {item.steps.map((step, si) => (
                                                                    <div key={si} className="flex gap-4 items-start group">
                                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                                                            {si + 1}
                                                                        </span>
                                                                        <p className="text-gray-300 pt-0.5">{step}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                                <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Poprawny wynik</span>
                                                                <div className="text-xl font-bold text-emerald-100">{item.solution}</div>
                                                            </div>

                                                            {item.tips && (
                                                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-100/80 italic text-sm">
                                                                    <Lightbulb className="w-5 h-5 flex-shrink-0 text-amber-400" />
                                                                    <p>{item.tips}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-12">
                                    <button onClick={() => setActivePhase(3)} className="btn-premium group">
                                        Rozpocznij Egzamin <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 duration-300" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activePhase === 3 && (
                            <motion.div
                                key="phase3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-12"
                            >
                                <div>
                                    <h2 className="text-4xl font-extrabold mb-4">Egzamin Próbny</h2>
                                    <p className="text-lg text-gray-400">Sprawdź swoją wiedzę rozwiązując zadania bez podpowiedzi.</p>
                                </div>

                                <div className="space-y-8">
                                    {data.phase3_exam.map((item, i) => (
                                        <div key={i} className="card-premium">
                                            <div className="mb-6">
                                                <span className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-2 block">Pytanie {i + 1}</span>
                                                <div className="text-2xl font-medium font-serif italic text-gray-100 whitespace-pre-wrap">{item.question}</div>
                                            </div>

                                            {revealedAnswers.includes(i) ? (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl"
                                                >
                                                    <div className="flex items-center gap-2 text-emerald-500 font-bold mb-2">
                                                        <CheckCircle2 className="w-5 h-5" /> Rozwiązanie
                                                    </div>
                                                    <div className="text-xl font-bold">{item.answer}</div>
                                                </motion.div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleAnswer(i)}
                                                    className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold text-gray-300 transition-all active:scale-95"
                                                >
                                                    Pokaż odpowiedź
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-indigo-600/10 border border-indigo-600/20 p-12 rounded-3xl text-center mt-20">
                                    <h3 className="text-3xl font-bold mb-4">To już koniec!</h3>
                                    <p className="text-gray-400 mb-8 max-w-lg mx-auto">Przeszedłeś przez cały cykl nauki. Jeśli czujesz niedosyt, możesz spróbować wygenerować nowy plan z innego dokumentu.</p>
                                    <Link href="/dashboard" className="btn-premium">Wróć do projektów</Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
