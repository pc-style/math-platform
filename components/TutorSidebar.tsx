"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTutor } from "@/context/TutorContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Brain, Sparkles, Mic } from "lucide-react";
import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MathContent } from "@/components/MathContent";

import { useGeminiLive } from "@/hooks/useGeminiLive";

export function TutorSidebar() {
    const { isOpen, setIsOpen, messages, addMessage, currentContext } = useTutor();
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const askQuestion = useAction(api.chat.askQuestion);

    // Voice Mode
    const incrementUsage = useMutation(api.users.incrementUsage);
    const { start: startVoice, stop: stopVoice, isActive: isVoiceActive, isConnecting: isVoiceConnecting } = useGeminiLive((duration) => {
        incrementUsage({ type: "audio", amount: duration });
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const userDetails = useQuery(api.users.getUserDetails);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Optimistic limit check (server will verify too)
        if (userDetails?.role === "member" && (userDetails.monthlyMessages || 0) >= 100) {
            addMessage("ai", "Osiągnąłeś limit 100 wiadomości. Przejdź na Premium!");
            return;
        }

        const userMessage = input.trim();
        setInput("");
        addMessage("user", userMessage);
        setIsLoading(true);

        try {
            const response = await askQuestion({
                question: userMessage,
                context: currentContext || "Witaj w aplikacji Math Platform.",
                history: messages.map((m) => ({
                    role: m.role === "ai" ? "model" : "user",
                    text: m.content,
                })),
            });

            addMessage("ai", response);
        } catch (error) {
            console.error("Chat error:", error);
            addMessage("ai", "Przepraszam, wystąpił błąd podczas łączenia z AI.");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleVoice = async () => {
        if (isVoiceActive) {
            stopVoice();
            addMessage("ai", "Tryb głosowy wyłączony.");

            // Note: useGeminiLive should ideally return the duration or we track it here
            // For now we'll simplify and increment by a reasonable chunk if it was a real session
        } else {
            if (userDetails?.role === "member" && (userDetails.monthlyAudioSeconds || 0) >= 300) {
                addMessage("ai", "Limit 5 minut rozmowy audio wyczerpany. Przejdź na Premium!");
                return;
            }

            addMessage("ai", "Łączenie z trybem głosowym...");
            // WARNING: API Key handling - usually should be proxied
            // For now assuming it's available or provided by user
            const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
            if (!key) {
                addMessage("ai", "Błąd: Brak klucza API dla trybu głosowego.");
                return;
            }
            await startVoice(key);
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 p-4 bg-[var(--primary)] text-black shadow-[0_0_20px_var(--glow)] hover:scale-110 active:scale-95 transition-all rounded-2xl"
                >
                    <Brain className="w-6 h-6" />
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-screen w-full md:max-w-md bg-[var(--surface)] border-l border-[var(--border)] z-[60] shadow-2xl flex flex-col glass"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background)]/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-[var(--foreground)]">Osobisty Tutor</h2>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? "bg-red-500 animate-ping" : "bg-green-500 animate-pulse"}`} />
                                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                                            {isVoiceActive ? "Voice Mode ACTIVE" : "AI Online"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[var(--border)]">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] p-4 ${msg.role === "user"
                                            ? "bg-[var(--primary)] text-black font-medium"
                                            : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                                            } ${msg.role === "user" ? "rounded-2xl rounded-tr-none" : "rounded-2xl rounded-tl-none"}`}
                                    >
                                        {msg.role === "ai" ? (
                                            <MathContent content={msg.content} />
                                        ) : (
                                            <p className="text-sm">{msg.content}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[var(--background)] border border-[var(--border)] p-4 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" />
                                            <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-6 border-t border-[var(--border)] bg-[var(--background)]/50">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Zadaj pytanie..."
                                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-4 pr-32 text-sm focus:outline-none focus:border-[var(--primary)]/50 transition-all font-medium"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        onClick={toggleVoice}
                                        className={`p-2 transition-colors rounded-xl tooltip ${isVoiceActive ? "text-red-500 bg-red-500/10 animate-pulse" : isVoiceConnecting ? "text-amber-500 animate-spin" : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5"}`}
                                        title={isVoiceActive ? "Stop Voice" : "Start Voice"}
                                    >
                                        <Mic className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || isLoading}
                                        className="p-3 bg-[var(--primary)] text-black rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-col gap-2">
                                <p className="text-[10px] text-[var(--text-muted)] text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                                    Powered by Gemini 3 Flash
                                </p>
                                {userDetails?.role === 'member' && (
                                    <div className="flex justify-center gap-4 border-t border-[var(--border)] mt-2 pt-2">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] text-[var(--text-muted)] uppercase font-black">Wiadomości</span>
                                            <span className="text-[10px] font-mono text-[var(--primary)] font-bold">{userDetails.monthlyMessages || 0}/100</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[9px] text-[var(--text-muted)] uppercase font-black">Audio</span>
                                            <span className="text-[10px] font-mono text-[var(--primary)] font-bold">
                                                {Math.round((userDetails.monthlyAudioSeconds || 0) / 60)}/5 min
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
