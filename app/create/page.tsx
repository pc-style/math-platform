"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Sparkles, AlertCircle, FileText } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Header } from "@/components/Header";
import { Id } from "../../convex/_generated/dataModel";
import { useThemeLabels } from "@/hooks/useThemeLabels";

export default function CreateExam() {
    const router = useRouter();
    interface FileWithBuffer {
        name: string;
        type: string;
        size: number;
        buffer: ArrayBuffer;
    }

    const [files, setFiles] = useState<FileWithBuffer[]>([]);
    const [title, setTitle] = useState("");
    const [isSpeedrun, setIsSpeedrun] = useState(false);
    const [hoursAvailable, setHoursAvailable] = useState(4);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getLabel, isCyber } = useThemeLabels();

    const createExam = useMutation(api.exams.createExam);
    const storeFile = useAction(api.exams.storeFile);
    const generateExamAction = useAction(api.exams.generateExam);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "application/pdf": [".pdf"] },
        multiple: true,
        onDrop: async (acceptedFiles) => {
            console.log(`[Create] Wybrano ${acceptedFiles.length} nowych plików. Odczytywanie do pamięci...`);
            try {
                const newFiles = await Promise.all(
                    acceptedFiles.map(async (f) => ({
                        name: f.name,
                        type: f.type,
                        size: f.size,
                        buffer: await f.arrayBuffer(),
                    }))
                );
                setFiles((prev) => [...prev, ...newFiles]);
                if (!title && newFiles.length > 0) {
                    setTitle(newFiles[0].name.replace(/\.pdf$/i, ""));
                }
            } catch (err) {
                console.error("[Create] Błąd podczas odczytu plików:", err);
                setError("Nie udało się odczytać wybranych plików. Spróbuj ponownie.");
            }
        },
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !title) return;

        setIsUploading(true);
        setError(null);
        console.log(`[Create] Rozpoczynanie przesyłania ${files.length} plików...`);

        try {
            const storageIds: Id<"_storage">[] = [];
            for (let i = 0; i < files.length; i++) {
                const item = files[i];
                console.log(`[Create] Przesyłanie pliku ${i + 1}/${files.length}: ${item.name} (${item.type})`);

                try {
                    console.log(`[Create] Przesyłanie przez Convex Action...`);
                    const storageId = await storeFile({ file: item.buffer, contentType: item.type });
                    if (!storageId) throw new Error("Nie udało się zapisać pliku w storage.");
                    storageIds.push(storageId);
                    console.log(`[Create] Plik zapisany: ${storageId}`);
                } catch (actionErr) {
                    console.error("[Create] Błąd akcji storeFile:", actionErr);
                    throw actionErr;
                }
            }

            console.log("[Create] Pliki przesłane. Tworzenie projektu w bazie...");
            const examId = await createExam({
                title,
                storageIds,
                isSpeedrun,
                hoursAvailable
            });

            console.log("[Create] Projekt utworzony. Uruchamianie analizy AI...");
            generateExamAction({
                examId,
                storageIds,
                isSpeedrun,
                hoursAvailable
            }).catch((e) => {
                console.error("[Create] Błąd AI:", e);
            });

            router.push("/dashboard");
        } catch (e) {
            console.error("[Create] Szczegóły błędu:", e);
            if (e instanceof TypeError && e.message === "Failed to fetch") {
                setError("BŁĄD POŁĄCZENIA: Nie można połączyć się z serwerem Convex. Sprawdź połączenie z internetem lub czy npx convex dev jest uruchomiony.");
            } else {
                setError(e instanceof Error ? e.message : "Wystąpił błąd podczas przesyłania plików.");
            }
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="max-w-3xl mx-auto px-6 py-20 w-full flex-1">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-[var(--foreground)]">{getLabel("newPlan")}</h1>
                    <p className="text-[var(--text-muted)] font-medium text-lg leading-relaxed">
                        {isCyber ? "// Prześlij pliki PDF z materiałami, a my zajmiemy się resztą." : "Prześlij swoje materiały, aby wygenerować spersonalizowaną ścieżkę nauki."}
                    </p>
                </div>

                <div className={`card-premium space-y-10 ${isCyber ? "" : "rounded-[2rem] shadow-xl"}`}>
                    <div>
                        <label className={`block text-xs font-bold mb-3 uppercase tracking-widest ${isCyber ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                            {isCyber ? "> nazwa_projektu" : "Nazwa projektu"}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="np. Analiza Matematyczna - Kolokwium 1"
                            className={`w-full px-6 py-4 text-lg font-medium outline-none transition-all ${isCyber ? "" : "rounded-2xl bg-[var(--background)] border-[var(--border)] focus:ring-2 ring-[var(--primary)]/20"}`}
                        />
                    </div>

                    <div className={`p-6 border-2 flex flex-col gap-6 transition-all ${isSpeedrun ? (isCyber ? "border-amber-500 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "border-amber-500 bg-amber-50/50 rounded-3xl shadow-lg shadow-amber-500/10") : "border-[var(--border)] hover:border-[var(--primary)]/30"} ${isCyber ? "" : "rounded-3xl"}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 ${isSpeedrun ? "bg-amber-500 text-black" : "bg-[var(--surface)] text-[var(--text-muted)]"} ${isCyber ? "" : "rounded-xl"}`}>
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-widest">EXAM REALLY SOON</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Zero-to-Hero Speedrun Mode</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={isSpeedrun}
                                    onChange={(e) => setIsSpeedrun(e.target.checked)}
                                />
                                <div className={`w-11 h-6 bg-[var(--surface)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500`}></div>
                            </label>
                        </div>

                        <AnimatePresence>
                            {isSpeedrun && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-4 border-t border-amber-500/20"
                                >
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-600 mb-4 text-center">
                                        Ile godzin masz do egzaminu?
                                    </label>
                                    <div className="flex items-center justify-center gap-8">
                                        <button
                                            onClick={() => setHoursAvailable(Math.max(1, hoursAvailable - 1))}
                                            className="w-12 h-12 flex items-center justify-center border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all font-bold rounded-lg"
                                        >
                                            -
                                        </button>
                                        <div className="flex flex-col items-center">
                                            <span className="text-4xl font-black text-amber-500 font-mono">{hoursAvailable}</span>
                                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Godzin</span>
                                        </div>
                                        <button
                                            onClick={() => setHoursAvailable(Math.min(48, hoursAvailable + 1))}
                                            className="w-12 h-12 flex items-center justify-center border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-all font-bold rounded-lg"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p className="mt-4 text-[10px] text-amber-600/70 font-medium text-center italic">
                                        AI wykluczy mniej ważne tematy, aby zmieścić się w tym czasie.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed p-12 text-center transition-all cursor-pointer group ${isDragActive
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 shadow-[0_0_30px_var(--glow)] scale-[1.01]'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/50'
                            } ${isCyber ? "" : "rounded-3xl"}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center">
                            <div className={`p-5 mb-6 transition-transform group-hover:scale-110 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl"}`}>
                                <Upload className="w-10 h-10" />
                            </div>
                            <p className="text-xl font-bold mb-2 uppercase tracking-wide">
                                {isDragActive ? "UPUŚĆ TERAZ" : (isCyber ? "UPUŚĆ_PLIKI" : "Wybierz pliki")}
                            </p>
                            <p className="text-sm text-[var(--text-muted)] font-medium">
                                {isCyber ? "// Obsługujemy pliki PDF (możesz dodać wiele)" : "Kliknij lub przeciągnij tutaj pliki PDF z materiałami."}
                            </p>
                        </div>
                    </div>

                    {/* File List */}
                    <AnimatePresence>
                        {files.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                            >
                                <p className="text-sm text-[var(--primary)] font-bold mb-2 uppercase tracking-widest">
                                    {isCyber ? `> [${files.length}] plików:` : `${files.length} wybrane pliki:`}
                                </p>
                                {files.map((file, idx) => (
                                    <motion.div
                                        key={`${file.name}-${idx}`}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex items-center justify-between p-4 border border-[var(--border)] bg-[var(--background)]/50 ${isCyber ? "" : "rounded-2xl"}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                                    [{(file.size / 1024 / 1024).toFixed(2)} MB]
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                            className={`p-2 transition-colors ${isCyber ? "hover:bg-[var(--primary)] hover:text-black" : "hover:bg-red-500/10 text-red-500 rounded-lg"}`}
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {error && (
                        <div className={`flex items-center gap-3 p-5 border border-red-500/50 bg-red-500/5 text-red-600 font-bold text-sm ${isCyber ? "" : "rounded-2xl"}`}>
                            <AlertCircle className="w-6 h-6" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || !title || isUploading}
                        className="btn-premium w-full py-5 text-xl group shadow-2xl"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                {getLabel("uploading")}
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                                GENERUJ PLAN Z AI
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
