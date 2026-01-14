
"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Clock, FileText, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";

import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";

export default function Dashboard() {
    const exams = useQuery(api.exams.getExams);
    const { getLabel, isCyber } = useThemeLabels();

    useEffect(() => {
        if (exams) {
            console.log(`[Dashboard] Pobrano ${exams.length} projektów.`);
        }
    }, [exams]);

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
                            <Link
                                key={exam._id}
                                href={`/exam/${exam._id}`}
                                className={`card-premium transition-all duration-300 group hover:scale-[1.01] flex flex-col ${isCyber ? "" : "rounded-3xl"}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl"}`}>
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                        <Clock className="w-4 h-4" />
                                        {formatDistanceToNow(exam.createdAt, { addSuffix: true, locale: pl })}
                                    </div>
                                </div>

                                <h3 className={`text-2xl font-bold mb-4 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-tight ${isCyber ? "font-mono" : "font-sans"}`}>
                                    {isCyber ? `> ${exam.title.toUpperCase()}` : exam.title}
                                </h3>

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-[var(--border)]">
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
                                    </div>
                                    <ArrowRight className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
