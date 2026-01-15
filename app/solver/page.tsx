"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Sparkles, FileText, Image as ImageIcon } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MathContent } from "@/components/MathContent";
import { Header } from "@/components/Header";

export default function SolverPage() {
    const [text, setText] = useState("");
    const [file, setFile] = useState<{ name: string; type: string; content: string } | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const solveExercise = useAction(api.solver.solveExercise);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setFile({
                name: selectedFile.name,
                type: selectedFile.type,
                content: result
            });
        };
        reader.readAsDataURL(selectedFile);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'application/pdf': []
        },
        maxFiles: 1
    });

    const handleSolve = async () => {
        if (!text && !file) return;
        setIsLoading(true);
        setResult(null);

        try {
            const args: { text: string; image?: string; pdf?: string } = { text };

            if (file) {
                if (file.type.startsWith('image/')) {
                    args.image = file.content;
                } else if (file.type === 'application/pdf') {
                    args.pdf = file.content;
                }
            }

            const response = await solveExercise(args);
            setResult(response);
        } catch (error) {
            console.error("Solver error:", error);
            setResult("Wystąpił błąd podczas rozwiązywania zadania. Spróbuj ponownie.");
        } finally {
            setIsLoading(false);
        }
    };

    const clearFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-7xl mx-auto w-full gap-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
                        AI <span className="text-[var(--primary)]">Solver</span>
                    </h1>
                    <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
                        Prześlij zdjęcie zadania lub plik PDF, a sztuczna inteligencja rozwiąże je krok po kroku.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 w-full h-full">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-[var(--radius)] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-64 ${
                                isDragActive
                                    ? "border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.02]"
                                    : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--surface)]"
                            }`}
                        >
                            <input {...getInputProps()} />
                            {file ? (
                                <div className="relative group">
                                    <div className="flex flex-col items-center gap-4">
                                        {file.type.startsWith('image/') ? (
                                            <ImageIcon className="w-16 h-16 text-[var(--primary)]" />
                                        ) : (
                                            <FileText className="w-16 h-16 text-[var(--primary)]" />
                                        )}
                                        <div className="text-sm font-bold truncate max-w-[200px]">{file.name}</div>
                                    </div>
                                    <button
                                        onClick={clearFile}
                                        className="absolute -top-4 -right-4 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-[var(--text-muted)] mb-4" />
                                    <p className="font-bold text-lg">Przeciągnij plik tutaj</p>
                                    <p className="text-sm text-[var(--text-muted)]">lub kliknij aby wybrać (PNG, JPG, PDF)</p>
                                </>
                            )}
                        </div>

                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Dodaj treść zadania lub dodatkowe instrukcje..."
                            className="w-full h-32 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] resize-none focus:border-[var(--primary)] transition-all"
                        />

                        <button
                            onClick={handleSolve}
                            disabled={isLoading || (!text && !file)}
                            className="btn-premium w-full py-4 text-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <Sparkles className="w-6 h-6" />
                            )}
                            {isLoading ? "Analizowanie..." : "Rozwiąż Zadanie"}
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-8 min-h-[500px] flex flex-col relative overflow-hidden">
                        {result ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <MathContent content={result} />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
                                <Sparkles className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium text-center">
                                    Wynik rozwiązania pojawi się tutaj.<br/>
                                    Obsługuje formatowanie LaTeX.
                                </p>
                            </div>
                        )}

                        {isLoading && (
                             <div className="absolute inset-0 bg-[var(--background)]/50 backdrop-blur-sm flex items-center justify-center z-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                                    <p className="font-bold animate-pulse">Gemini 3 myśli...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
