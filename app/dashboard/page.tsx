
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Plus, Clock, FileText, ArrowRight, Loader2, Flame, Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";

export default function Dashboard() {
    const exams = useQuery(api.exams.getExams);
    const syncStats = useMutation(api.users.syncStats);
    const [stats, setStats] = useState<{ xp: number; streak: number } | null>(null);
    const { getLabel, isCyber } = useThemeLabels();

    const renameExam = useMutation(api.exams.renameExam);
    const deleteExam = useMutation(api.exams.deleteExam);

    useEffect(() => {
        syncStats().then(setStats);
    }, [syncStats]);

    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameTitle, setRenameTitle] = useState("");

    const handleRename = async (id: Id<"exams">) => {
        if (!renameTitle.trim()) {
            setRenamingId(null);
            return;
        }
        await renameExam({ id: id, title: renameTitle });
        setRenamingId(null);
        setRenameTitle("");
    };

    const handleDelete = async (id: Id<"exams">) => {
        if (confirm("Czy na pewno chcesz usunąć ten projekt? Tej operacji nie można cofnąć.")) {
            await deleteExam({ id: id });
        }
    };

    if (exams === undefined) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-[var(--primary)] animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="max-w-6xl mx-auto px-8 py-20 w-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
                    <div>
                        <h1 className="text-5xl font-extrabold mb-3 tracking-tight text-[var(--foreground)]">{getLabel("projects")}</h1>
                        <p className="text-[var(--text-muted)] font-medium text-lg max-w-xl">
                            {isCyber ? "// Zarządzaj swoimi planami nauki" : "Twoja osobista biblioteka spersonalizowanych planów nauki."}
                        </p>
                    </div>
                    <Link href="/create" className="btn-premium flex items-center gap-3 px-8 py-4">
                        <Plus className="w-6 h-6" />
                        {getLabel("newPlan")}
                    </Link>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-2 gap-6 mb-12">
                        <div className={`p-6 flex items-center gap-6 ${isCyber ? "border border-[var(--primary)] bg-[var(--primary)]/5" : "bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-3xl"}`}>
                            <div className="p-4 bg-orange-500/10 text-orange-500 rounded-2xl">
                                <Flame className="w-8 h-8 animate-pulse" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Dni z rzędu</p>
                                <p className={`text-4xl font-black ${isCyber ? "font-mono text-[var(--primary)]" : "text-orange-500"}`}>
                                    {stats.streak}
                                </p>
                            </div>
                        </div>
                        <div className={`p-6 flex items-center gap-6 ${isCyber ? "border border-[var(--primary)] bg-[var(--primary)]/5" : "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 rounded-3xl"}`}>
                            <div className="p-4 bg-yellow-500/10 text-yellow-500 rounded-2xl">
                                <Trophy className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Twój wynik (XP)</p>
                                <p className={`text-4xl font-black ${isCyber ? "font-mono text-[var(--primary)]" : "text-yellow-500"}`}>
                                    {stats.xp}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {exams.length === 0 ? (
                    <div className="card-premium text-center py-24">
                        <div className={`w-20 h-20 mx-auto flex items-center justify-center mb-8 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)]/5 text-[var(--primary)] rounded-full"}`}>
                            <Plus className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 font-sans">Twój schowek jest pusty</h2>
                        <p className="text-[var(--text-muted)] mb-10 max-w-md mx-auto">Prześlij swój pierwszy dokument PDF, aby wygenerować plan nauki.</p>
                        <Link href="/create" className="btn-premium px-10">
                            Zacznij teraz
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {exams.map((exam) => (
                            <div
                                key={exam._id}
                                className={`card-premium transition-all duration-300 group hover:scale-[1.01] flex flex-col relative ${isCyber ? "" : "rounded-3xl"}`}
                            >
                                <div className="flex justify-between items-start mb-8 z-10">
                                    <div className={`p-4 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl"}`}>
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                            <Clock className="w-4 h-4" />
                                            {formatDistanceToNow(exam.createdAt, { addSuffix: true, locale: pl })}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setRenamingId(exam._id);
                                                    setRenameTitle(exam.title);
                                                }}
                                                className="text-xs font-bold bg-[var(--surface)] border border-[var(--border)] px-2 py-1 rounded hover:text-[var(--foreground)]"
                                            >
                                                Zmień nazwę
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDelete(exam._id);
                                                }}
                                                className="text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded hover:bg-red-500/20"
                                            >
                                                Usuń
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {renamingId === exam._id ? (
                                    <div className="mb-4 z-20">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={renameTitle}
                                            onChange={(e) => setRenameTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleRename(exam._id);
                                                if (e.key === "Escape") setRenamingId(null);
                                            }}
                                            onBlur={() => handleRename(exam._id)}
                                            className="w-full bg-[var(--background)] border border-[var(--primary)] p-2 rounded text-lg font-bold"
                                        />
                                    </div>
                                ) : (
                                    <Link href={`/exam/${exam._id}`} className="block">
                                        <h3 className={`text-2xl font-bold mb-4 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-tight ${isCyber ? "font-mono" : "font-sans"}`}>
                                            {isCyber ? `> ${exam.title.toUpperCase()}` : exam.title}
                                        </h3>
                                    </Link>
                                )}

                                <Link href={`/exam/${exam._id}`} className="flex items-center justify-between mt-auto pt-6 border-t border-[var(--border)] z-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider py-1 px-3 ${exam.status === 'ready'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-amber-500/10 text-amber-500'
                                            } ${isCyber ? "" : "rounded-full"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${exam.status === 'ready' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                                            {exam.status === 'ready' ? 'Gotowe' : 'W procesie'}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)] font-mono">
                                            [{exam.storageIds.length} pliki]
                                        </span>
                                        {exam.isSpeedrun && (
                                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-amber-500 text-black animate-pulse">
                                                <AlertCircle className="w-2.5 h-2.5" /> Speedrun ({exam.hoursAvailable}h)
                                            </span>
                                        )}
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
