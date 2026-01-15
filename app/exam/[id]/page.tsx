
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, BookOpen, PenTool, Award, ChevronDown,
    CheckCircle2, Circle, ArrowLeft,
    Sparkles, Lightbulb, GraduationCap, ChevronRight,
    MessageSquare, Wand2, X, ArrowRight, Clock, FileText
} from "lucide-react";
import confetti from "canvas-confetti";
import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";
import { Id } from "../../../convex/_generated/dataModel";
import { useAction } from "convex/react";
import { MathContent } from "@/components/MathContent";
import { useTutor } from "@/context/TutorContext";

export default function ExamStudyView() {
    const { setCurrentContext } = useTutor();
    const params = useParams();
    const router = useRouter();
    const examId = params.id as Id<"exams">;
    const exam = useQuery(api.exams.getExam, { id: examId });
    const { getLabel, isCyber } = useThemeLabels();

    const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [revealedSolutions, setRevealedSolutions] = useState<Set<number>>(new Set());
    const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [hintIndices, setHintIndices] = useState<Record<number, number>>({});
    const [activeChatProblem, setActiveChatProblem] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<Record<string, { role: 'user' | 'model', text: string }[]>>({});
    const [timeLeft, setTimeLeft] = useState(3600); // 60 mins default
    const [isExamRunning, setIsExamRunning] = useState(false);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    const askQuestionValue = useAction(api.chat.askQuestion);
    const explainTheory = useAction(api.chat.explainTheory);

    const [activeTheoryIndex, setActiveTheoryIndex] = useState(0);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        if (exam?.data) {
            console.log(`[ExamView] Załadowano projekt: ${exam.title}. Status: ${exam.status}`);

            // Sync context with Tutor
            let currentItemContext = "";
            if (activePhase === 1) {
                const item = exam.data.phase1_theory[activeTheoryIndex];
                currentItemContext = `AKTUALNY TEMAT TEORII: ${item.topic}\nTREŚĆ: ${item.content}`;
            } else if (activePhase === 2) {
                const item = exam.data.phase2_guided[0]; // Simplification for guided
                currentItemContext = `AKTUALNE ZADANIE PROWADZONE: ${item.question}`;
            } else if (activePhase === 3) {
                currentItemContext = `ETAP EGZAMINU. ROZWIĄZYWANIE ZADAŃ KOŃCOWYCH.`;
            }

            const fullContext = `
PROJEKT: ${exam.title}
STRUKTURA PLANU:
- TEORIA: ${exam.data.phase1_theory.map(t => t.topic).join(", ")}
- ZADANIA: ${exam.data.phase2_guided.length + exam.data.phase3_exam.length} zadań łącznie

${currentItemContext}

DODATKOWE INFO: Jesteś zintegrowany z interfejsem. Uczeń właśnie przegląda fazę ${activePhase}.
            `.trim();

            setCurrentContext(fullContext);
        }
    }, [exam, activePhase, activeTheoryIndex, setCurrentContext]);

    const addXp = useMutation(api.users.addXp);

    const progress = useMemo(() => {
        if (!exam?.data) return 0;
        const total = exam.data.phase1_theory.length + exam.data.phase2_guided.length + exam.data.phase3_exam.length;
        return Math.round((completedSteps.size / total) * 100);
    }, [completedSteps, exam]);

    useEffect(() => {
        if (progress === 100) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: isCyber ? ['#00ff9d', '#00bcd4', '#ffffff'] : undefined
            });
            // Bonus XP for completion
            addXp({ amount: 50 });
        }
    }, [progress, isCyber, addXp]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (isExamRunning && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isExamRunning) {
            setIsExamRunning(false);
            setActivePhase(3);
        }
        return () => clearInterval(timer);
    }, [isExamRunning, timeLeft]);

    const toggleSolution = (idx: number) => {
        const next = new Set(revealedSolutions);
        if (next.has(idx)) next.delete(idx);
        else next.add(idx);
        setRevealedSolutions(next);
    };

    const toggleCompletion = (phase: number, idx: number) => {
        const key = `${phase}-${idx}`;
        const next = new Set(completedSteps);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
            // Award XP for completing a step
            addXp({ amount: 10 });
            // Small confetti burst for step completion
            confetti({
                particleCount: 30,
                spread: 50,
                origin: { x: 0.5, y: 0.8 }, // Bottom center-ish
                gravity: 0.8,
                scalar: 0.8,
                colors: isCyber ? ['#00ff9d'] : undefined
            });
        }
        setCompletedSteps(next);
    };

    if (exam === undefined) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!exam || exam.status === 'error') {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="max-w-xl mx-auto px-6 py-20 text-center">
                    <div className="bg-red-500/10 text-red-500 p-6 rounded-2xl mb-8 border border-red-500/20">
                        <ArrowLeft className="w-8 h-8 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2 uppercase">Wystąpił błąd</h2>
                        <p className="font-medium text-sm">{exam?.error || "Nie udało się załadować projektu."}</p>
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="btn-premium text-sm px-6 py-3">
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
                        className={`p-8 mb-8 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)] shadow-[0_0_30px_var(--glow)]" : "bg-[var(--primary)]/5 text-[var(--primary)] rounded-full shadow-xl"}`}
                    >
                        <Brain className={`w-12 h-12 ${isCyber ? "animate-glitch" : "animate-pulse"}`} />
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-3 tracking-tight">{getLabel("generating")}</h2>
                    <p className="text-[var(--text-muted)] max-w-sm mb-8 text-sm font-medium leading-relaxed">
                        Analizuję materiały, wyciągam wzory i tworzę plan. Chwilka.
                    </p>
                    <div className="w-48 h-1 bg-[var(--border)] rounded-full overflow-hidden mb-8">
                        <motion.div
                            className="h-full bg-[var(--primary)] shadow-[0_0_10px_var(--glow)]"
                            animate={{ width: ["0%", "40%", "70%", "95%"] }}
                            transition={{ duration: 45, ease: "easeInOut" }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const { phase1_theory, phase2_guided, phase3_exam } = exam.data!;

    // --- Hints State ---
    // (hintIndices defined above)

    const nextHint = (idx: number, max: number) => {
        setHintIndices(prev => ({
            ...prev,
            [idx]: Math.min((prev[idx] ?? -1) + 1, max - 1)
        }));
    };

    const prevHint = (idx: number) => {
        setHintIndices(prev => ({
            ...prev,
            [idx]: Math.max((prev[idx] ?? -1) - 1, -1)
        }));
    };

    // --- Chat State ---
    // (activeChatProblem, chatMessages, chatInput, isThinking defined above)

    // const askQuestion defined above

    const handleAskAI = async (problemId: string, context: string) => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput("");
        setIsThinking(true);

        const currentHistory = chatMessages[problemId] || [];
        const newHistory = [...currentHistory, { role: 'user' as const, text: msg }];
        setChatMessages(prev => ({ ...prev, [problemId]: newHistory }));

        try {
            const answer = await askQuestionValue({
                question: msg,
                context: context,
                history: currentHistory.map(m => ({
                    role: m.role,
                    text: m.text
                }))
            });

            if (answer !== null) {
                setChatMessages(prev => ({
                    ...prev,
                    [problemId]: [...newHistory, { role: 'model', text: answer }]
                }));
            }
        } catch (e) {
            console.error("Chat error", e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleExplain = async (item: { topic: string; content: string }) => {
        setIsExplaining(true);
        setShowExplanation(true);
        try {
            const result = await explainTheory({
                topic: item.topic,
                content: item.content
            });
            setExplanation(result);
        } catch (e) {
            console.error(e);
            setExplanation("Przepraszam, wystąpił błąd podczas generowania wyjaśnienia.");
        } finally {
            setIsExplaining(false);
        }
    };

    const handleNextTheory = () => {
        if (!exam?.data) return;
        const total = exam.data.phase1_theory.length;
        if (activeTheoryIndex < total - 1) {
            setActiveTheoryIndex(prev => prev + 1);
            setExplanation(null);
            setShowExplanation(false);
            // Mark previous as completed? Maybe.
            toggleCompletion(1, activeTheoryIndex);
            // Only toggle if not already marked? 
            // Logic: if user moves next, they probably read it. 
        }
    };

    const handlePrevTheory = () => {
        if (activeTheoryIndex > 0) {
            setActiveTheoryIndex(prev => prev - 1);
            setExplanation(null);
            setShowExplanation(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <div className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
                {/* Header Info - Compact */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8 border-b border-[var(--border)] pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                            <GraduationCap className="w-3 h-3" />
                            <span>Plan: {exam.title}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] font-serif italic">
                            {exam.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">Postęp</p>
                            <p className="text-2xl font-bold text-[var(--primary)]">{progress}%</p>
                        </div>
                        <div className="w-10 h-10 relative">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-[var(--border)]" />
                                <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-[var(--primary)]" strokeDasharray={100} strokeDashoffset={100 - (100 * progress) / 100} />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Phase Tabs - Compact */}
                <div className="flex gap-6 mb-8 border-b border-[var(--border)] relative px-2 overflow-x-auto scrollbar-none">
                    {[
                        { id: 1 as const, icon: BookOpen, label: getLabel("theory") },
                        { id: 2 as const, icon: PenTool, label: getLabel("practice") },
                        { id: 3 as const, icon: Award, label: getLabel("exam") },
                        { id: 4 as const, icon: FileText, label: "Fiszki" },
                        { id: 5 as const, icon: Clock, label: "Symulacja" }
                    ].map((phase) => (
                        <button
                            key={phase.id}
                            onClick={() => { setActivePhase(phase.id); }}
                            className={`pb-3 flex items-center gap-2 transition-all relative shrink-0 ${activePhase === phase.id ? "text-[var(--foreground)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                        >
                            <phase.icon className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wide uppercase hidden sm:inline">{phase.label}</span>
                            {activePhase === phase.id && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--foreground)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activePhase === 1 && (
                            <motion.div
                                key="theory-carousel"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Progress Bar for Theory */}
                                <div className="flex items-center gap-2 mb-4">
                                    {phase1_theory.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full flex-1 transition-all ${idx === activeTheoryIndex ? "bg-[var(--primary)]" :
                                                idx < activeTheoryIndex ? "bg-[var(--primary)]/30" : "bg-[var(--border)]"
                                                }`}
                                        />
                                    ))}
                                </div>

                                <div className="card-premium relative min-h-[400px] flex flex-col justify-between">
                                    {/* Action Bar */}
                                    <div className="flex justify-between items-start mb-6 border-b border-[var(--border)] pb-4">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">
                                                Koncept {activeTheoryIndex + 1} / {phase1_theory.length}
                                            </span>
                                            <h2 className="text-2xl font-black font-serif italic text-[var(--foreground)]">
                                                {phase1_theory[activeTheoryIndex].topic}
                                            </h2>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleExplain(phase1_theory[activeTheoryIndex])}
                                                className="p-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors tooltip flex items-center gap-2 text-xs font-bold"
                                                title="Wyjaśnij prościej"
                                            >
                                                <Wand2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Wyjaśnij (Feynman)</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const chatId = `p1-${activeTheoryIndex}`;
                                                    if (activeChatProblem === chatId) {
                                                        setActiveChatProblem(null);
                                                    } else {
                                                        setActiveChatProblem(chatId);
                                                    }
                                                }}
                                                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold ${activeChatProblem === `p1-${activeTheoryIndex}` ? "bg-[var(--primary)] text-white" : "bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"}`}
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="hidden sm:inline">Zapytaj</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Phase 1 Chat Overlay */}
                                    <AnimatePresence>
                                        {activeChatProblem === `p1-${activeTheoryIndex}` && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mb-6 rounded-xl overflow-hidden glass border border-[var(--primary)]/30"
                                            >
                                                <div className="bg-[var(--primary)] text-white p-3 flex justify-between items-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                        <Brain className="w-3 h-3" /> Asystent Teorii
                                                    </span>
                                                    <button onClick={() => setActiveChatProblem(null)}>
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="h-[250px] overflow-y-auto p-4 space-y-3 bg-[var(--surface)]">
                                                    {(!chatMessages[`p1-${activeTheoryIndex}`] || chatMessages[`p1-${activeTheoryIndex}`].length === 0) && (
                                                        <p className="text-xs text-[var(--text-muted)] text-center mt-8">
                                                            Masz pytania do tego tematu? Pisz śmiało!
                                                        </p>
                                                    )}
                                                    {chatMessages[`p1-${activeTheoryIndex}`]?.map((msg, i) => (
                                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[90%] rounded-xl p-3 text-xs md:text-sm font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                                                                ? 'bg-[var(--primary)] text-white'
                                                                : 'bg-[var(--background)] border border-[var(--border)]'
                                                                }`}>
                                                                <MathContent content={msg.text} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {isThinking && (
                                                        <div className="flex justify-start">
                                                            <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-3 text-xs text-[var(--text-muted)] animate-pulse shadow-sm">
                                                                AI myśli...
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-[var(--background)] border-t border-[var(--border)]">
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            handleAskAI(`p1-${activeTheoryIndex}`, `Temat: ${phase1_theory[activeTheoryIndex].topic}\nTreść: ${phase1_theory[activeTheoryIndex].content}`);
                                                        }}
                                                        className="flex gap-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            value={chatInput}
                                                            onChange={(e) => setChatInput(e.target.value)}
                                                            className="flex-1 bg-[var(--surface)] text-sm px-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)]"
                                                            placeholder="Zadaj pytanie..."
                                                            autoFocus
                                                        />
                                                        <button type="submit" disabled={isThinking || !chatInput.trim()} className="p-2 bg-[var(--primary)] text-white rounded-lg disabled:opacity-50 hover:bg-[var(--primary)]/90 transition-colors">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Content */}
                                    <div className="text-lg leading-relaxed mb-8 flex-1">
                                        <MathContent content={phase1_theory[activeTheoryIndex].content} />
                                    </div>

                                    {/* Navigation */}
                                    <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
                                        <button
                                            onClick={handlePrevTheory}
                                            disabled={activeTheoryIndex === 0}
                                            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:hover:text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                            Poprzedni
                                        </button>

                                        <button
                                            onClick={() => toggleCompletion(1, activeTheoryIndex)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${completedSteps.has(`1-${activeTheoryIndex}`)
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary)]"
                                                }`}
                                        >
                                            {completedSteps.has(`1-${activeTheoryIndex}`) ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4" /> Zrozumiano
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="w-4 h-4" /> Oznacz jako zrozumiałe
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={handleNextTheory}
                                            disabled={activeTheoryIndex === phase1_theory.length - 1}
                                            className="flex items-center gap-2 text-[var(--primary)] hover:translate-x-1 font-bold uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:translate-x-0 disabled:text-[var(--text-muted)]"
                                        >
                                            Następny
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* AI Explanation Overlay/Section */}
                                    <AnimatePresence>
                                        {showExplanation && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute inset-0 bg-[var(--surface)]/95 backdrop-blur-xl z-20 p-6 flex flex-col rounded-[var(--radius)]"
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-amber-600">
                                                        <Sparkles className="w-4 h-4" />
                                                        Proste Wyjaśnienie
                                                    </h3>
                                                    <button onClick={() => setShowExplanation(false)} className="p-1 hover:bg-[var(--border)] rounded-full transition-colors">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto pr-2">
                                                    {isExplaining ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4">
                                                            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                                            <p className="text-xs font-bold animate-pulse">Generuję wyjaśnienie...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                                            <MathContent content={explanation || ""} />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {activePhase === 2 && (
                            <motion.div
                                key="practice-list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                {phase2_guided.map((item, idx) => (
                                    <div key={idx} className="border-l-2 border-[var(--border)] pl-6 py-2 relative">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--primary)]" />

                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">Zadanie {idx + 1}</span>
                                                <button onClick={() => toggleCompletion(2, idx)}>
                                                    {completedSteps.has(`2-${idx}`)
                                                        ? <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ukończono</span>
                                                        : <span className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)]">Oznacz jako gotowe</span>
                                                    }
                                                </button>
                                            </div>
                                            <h3 className="text-xl font-bold mb-3 font-serif">
                                                <MathContent content={item.question} />
                                            </h3>
                                            {item.description && (
                                                <div className="text-[var(--text-muted)] mb-4 text-sm">
                                                    <MathContent content={item.description} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Left: Solution Flow */}
                                            <div className="lg:col-span-2 space-y-4">
                                                <div className="glass p-5 rounded-xl">
                                                    <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 opacity-75">
                                                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                                                        Kroki Rozwiązania
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {item.steps.map((step, sidx) => (
                                                            <div key={sidx} className="flex gap-3">
                                                                <div className="flex-col items-center flex">
                                                                    <div className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] text-[10px] flex items-center justify-center font-bold">
                                                                        {sidx + 1}
                                                                    </div>
                                                                    {sidx !== item.steps.length - 1 && <div className="w-px h-full bg-[var(--border)] my-1" />}
                                                                </div>
                                                                <div className="pb-2 text-sm">
                                                                    <MathContent content={step} />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Hints Section */}
                                                {item.hints && item.hints.length > 0 && (
                                                    <div className="bg-amber-50/50 dark:bg-amber-900/5 border border-amber-200/50 dark:border-amber-800/30 rounded-xl p-5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500 flex items-center gap-2">
                                                                <Sparkles className="w-3 h-3" />
                                                                Wskazówki ({((hintIndices[idx] ?? -1) + 1)} / {item.hints.length})
                                                            </h4>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => prevHint(idx)}
                                                                    disabled={(hintIndices[idx] ?? -1) < 0}
                                                                    className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/50 disabled:opacity-30 transition-colors"
                                                                >
                                                                    <ArrowLeft className="w-4 h-4 text-amber-700" />
                                                                </button>
                                                                <button
                                                                    onClick={() => nextHint(idx, item.hints?.length || 0)}
                                                                    disabled={(hintIndices[idx] ?? -1) >= (item.hints?.length || 0) - 1}
                                                                    className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/50 disabled:opacity-30 transition-colors"
                                                                >
                                                                    <ChevronRight className="w-4 h-4 text-amber-700" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="min-h-[3rem] relative text-sm">
                                                            <AnimatePresence mode="wait">
                                                                {(hintIndices[idx] ?? -1) >= 0 ? (
                                                                    <motion.div
                                                                        key={hintIndices[idx]}
                                                                        initial={{ opacity: 0, x: 10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        exit={{ opacity: 0, x: -10 }}
                                                                        className="text-amber-800 dark:text-amber-200 font-medium italic leading-relaxed"
                                                                    >
                                                                        <MathContent content={item.hints[hintIndices[idx]]} />
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                                        className="text-amber-800/50 dark:text-amber-200/50 italic"
                                                                    >
                                                                        Kliknij strzałkę, aby zobaczyć podpowiedź.
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                )}

                                            </div>

                                            {/* Right: Interaction Area / AI Chat */}
                                            <div className="space-y-4">
                                                {/* Final Solution */}
                                                <div className="glass rounded-xl overflow-hidden">
                                                    <button
                                                        onClick={() => toggleSolution(idx)}
                                                        className="w-full p-3 flex items-center justify-between text-xs font-bold hover:bg-[var(--surface)] transition-colors uppercase tracking-wider"
                                                    >
                                                        <span>{revealedSolutions.has(idx) ? "Ukryj" : "Sprawdź"} Wynik</span>
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${revealedSolutions.has(idx) ? "rotate-180" : ""}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {revealedSolutions.has(idx) && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: "auto" }}
                                                                exit={{ height: 0 }}
                                                                className="bg-green-50/50 dark:bg-green-900/10 border-t border-green-100 dark:border-green-900/30"
                                                            >
                                                                <div className="p-4 text-green-800 dark:text-green-300 font-bold text-base">
                                                                    <MathContent content={item.solution} />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* AI Chat Button/Window */}
                                                <div>
                                                    {activeChatProblem !== `p2-${idx}` ? (
                                                        <button
                                                            onClick={() => setActiveChatProblem(`p2-${idx}`)}
                                                            className="w-full py-3 px-4 rounded-xl border border-[var(--primary)] text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)] hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-wide shadow-sm"
                                                        >
                                                            <MessageSquare className="w-3 h-3" />
                                                            Zapytaj AI
                                                        </button>
                                                    ) : (
                                                        <div className="glass rounded-xl shadow-[0_4px_20px_var(--glow)] overflow-hidden flex flex-col h-[350px] border border-[var(--primary)]/30">
                                                            <div className="bg-[var(--primary)] text-white p-3 flex justify-between items-center bg-opacity-90 backdrop-blur-sm">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                                                    <Brain className="w-3 h-3" /> Asystent
                                                                </span>
                                                                <button onClick={() => setActiveChatProblem(null)} className="hover:opacity-75">
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[var(--surface)]">
                                                                {(!chatMessages[`p2-${idx}`] || chatMessages[`p2-${idx}`].length === 0) && (
                                                                    <p className="text-[10px] text-[var(--text-muted)] text-center mt-4">Napisz, z czym masz problem w tym zadaniu.</p>
                                                                )}
                                                                {chatMessages[`p2-${idx}`]?.map((msg, i) => (
                                                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                        <div className={`max-w-[90%] rounded-xl p-2.5 text-xs font-medium leading-relaxed ${msg.role === 'user'
                                                                            ? 'bg-[var(--primary)] text-white shadow-sm'
                                                                            : 'bg-[var(--background)] border border-[var(--border)] shadow-sm'
                                                                            }`}>
                                                                            <MathContent content={msg.text} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {isThinking && (
                                                                    <div className="flex justify-start">
                                                                        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-2.5 text-[10px] text-[var(--text-muted)] animate-pulse shadow-sm">
                                                                            AI pisze...
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-2 bg-[var(--background)] border-t border-[var(--border)]">
                                                                <form
                                                                    onSubmit={(e) => { e.preventDefault(); handleAskAI(`p2-${idx}`, `Zadanie: ${item.question}\nKroki: ${JSON.stringify(item.steps)}`); }}
                                                                    className="flex gap-2"
                                                                >
                                                                    <input
                                                                        type="text"
                                                                        value={chatInput}
                                                                        onChange={(e) => setChatInput(e.target.value)}
                                                                        className="flex-1 bg-[var(--surface)] text-xs px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] transition-all"
                                                                        placeholder="Zapytaj..."
                                                                    />
                                                                    <button type="submit" disabled={isThinking} className="p-2 bg-[var(--primary)] text-white rounded-lg disabled:opacity-50 hover:bg-[var(--primary)]/90 transition-colors">
                                                                        <ChevronRight className="w-3 h-3" />
                                                                    </button>
                                                                </form>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activePhase === 3 && (
                            <motion.div
                                key="exam-list"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="p-6 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30 rounded-xl text-center mb-6">
                                    <h2 className="text-lg font-bold font-serif mb-1 text-amber-900 dark:text-amber-100">Sprawdzian Wiedzy</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Rozwiąż zadania samodzielnie.</p>
                                </div>

                                {phase3_exam.map((item, idx) => (
                                    <div key={idx} className="glass p-6 group hover:border-[var(--primary)]/30 transition-colors">
                                        <div className="flex items-start gap-4 mb-4">
                                            <button onClick={() => toggleCompletion(3, idx)} className="mt-0.5 flex-shrink-0">
                                                {completedSteps.has(`3-${idx}`)
                                                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                    : <Circle className="w-5 h-5 text-[var(--border)] group-hover:text-[var(--text-muted)]" />
                                                }
                                            </button>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Pytanie {idx + 1}</span>
                                                </div>
                                                <h3 className="text-lg font-bold">
                                                    <MathContent content={item.question} />
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="pl-9">
                                            <button
                                                onClick={() => toggleSolution(idx + 100)}
                                                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ${revealedSolutions.has(idx + 100) ? "text-amber-600" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
                                            >
                                                {revealedSolutions.has(idx + 100) ? "Ukryj Odpowiedź" : "Pokaż Odpowiedź"}
                                                <ChevronRight className={`w-3 h-3 transition-transform ${revealedSolutions.has(idx + 100) ? "rotate-90" : ""}`} />
                                            </button>

                                            <AnimatePresence>
                                                {revealedSolutions.has(idx + 100) && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg"
                                                    >
                                                        <div className="font-bold text-sm text-amber-800 dark:text-amber-200">
                                                            <MathContent content={item.answer} />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activePhase === 4 && exam?.data?.flashcards && (
                            <motion.div
                                key="flashcards"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center min-h-[400px] gap-8"
                            >
                                <div className="text-center">
                                    <h2 className="text-xl font-bold mb-2">Aktywne Przypominanie</h2>
                                    <p className="text-xs text-[var(--text-muted)]">Fiszka {flashcardIndex + 1} z {exam.data?.flashcards?.length || 0}</p>
                                </div>

                                <div
                                    className="perspective-1000 w-full max-w-sm h-64 cursor-pointer"
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <motion.div
                                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                                        className="relative w-full h-full preserve-3d"
                                    >
                                        {/* Front */}
                                        <div className="absolute inset-0 backface-hidden glass flex items-center justify-center p-8 text-center bg-[var(--surface)]">
                                            <div className="text-lg font-bold">
                                                <MathContent content={exam.data?.flashcards?.[flashcardIndex]?.front || ""} />
                                            </div>
                                            <div className="absolute bottom-4 text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Kliknij, aby odwrócić</div>
                                        </div>
                                        {/* Back */}
                                        <div className="absolute inset-0 backface-hidden glass flex items-center justify-center p-8 text-center bg-[var(--primary)] text-black rotate-y-180">
                                            <div className="text-sm font-medium">
                                                <MathContent content={exam.data?.flashcards?.[flashcardIndex]?.back || ""} />
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setIsFlipped(false);
                                            const count = exam.data?.flashcards?.length || 0;
                                            setFlashcardIndex(prev => (prev > 0 ? prev - 1 : count - 1));
                                        }}
                                        className="btn-secondary px-6"
                                    >
                                        Poprzednia
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsFlipped(false);
                                            const count = exam.data?.flashcards?.length || 0;
                                            setFlashcardIndex(prev => (prev < count - 1 ? prev + 1 : 0));
                                        }}
                                        className="btn-premium px-6"
                                    >
                                        Następna
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {activePhase === 5 && (
                            <motion.div
                                key="simulation"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-6"
                            >
                                <div className="card-premium p-8 text-center space-y-4">
                                    <div className="inline-flex p-4 bg-amber-500/10 text-amber-500 rounded-2xl mb-2">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black italic font-serif text-[var(--foreground)]">Symulacja Egzaminu</h2>
                                    <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
                                        Gotowy na ostateczny test? Masz 60 minut na rozwiązanie wszystkich zadań bez podpowiedzi.
                                    </p>

                                    {!isExamRunning ? (
                                        <button
                                            onClick={() => {
                                                setIsExamRunning(true);
                                                setTimeLeft(3600);
                                                setActivePhase(3); // Start with tasks in Phase 3 mode but with timer
                                            }}
                                            className="btn-premium px-12 py-4 text-sm font-black tracking-widest"
                                        >
                                            ROZPOCZNIJ SYMULACJĘ
                                        </button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="text-4xl font-mono font-black text-amber-500">
                                                {formatTime(timeLeft)}
                                            </div>
                                            <button
                                                onClick={() => setIsExamRunning(false)}
                                                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 underline"
                                            >
                                                Przerwij egzamin
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {progress === 100 && (
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-8 right-8 glass bg-[var(--primary)] text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-4 cursor-pointer"
                    onClick={() => router.push('/dashboard')}
                >
                    <Award className="w-8 h-8" />
                    <div>
                        <p className="font-bold uppercase tracking-widest text-xs opacity-75">Ukończono</p>
                        <p className="font-bold">Gratulacje! Wróć do bazy.</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
