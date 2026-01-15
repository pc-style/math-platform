
"use client";

import { useState, useEffect } from "react";
import { Copy, Terminal, X, ChevronDown, ChevronUp } from "lucide-react";

export function DebugOverlay() {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);

    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return;

        const interval = setInterval(() => {
            const globalLogs = (window as unknown as { __APP_LOGS?: { time: string; msg: string }[] }).__APP_LOGS;
            if (globalLogs) {
                setLogs([...globalLogs].reverse());
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (process.env.NODE_ENV !== "development") return null;

    const copyLogs = () => {
        const text = logs.map(l => `[${l.time}] ${l.msg}`).join("\n");
        navigator.clipboard.writeText(text);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-[9999] p-3 bg-black/80 border border-white/20 rounded-full text-white/50 hover:text-white transition-all shadow-xl backdrop-blur-md"
            >
                <Terminal className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className={`fixed right-4 z-[9999] bg-black/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 flex flex-col ${isExpanded ? "bottom-4 w-96 h-[500px]" : "bottom-4 w-64 h-20"
            }`}>
            <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white/60">
                    <Terminal className="w-4 h-4" />
                    SYSTEM_LOGS
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={copyLogs} className="p-1 hover:bg-white/5 rounded" title="Copy Logs">
                        <Copy className="w-4 h-4 text-white/40" />
                    </button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-white/5 rounded">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-white/40" /> : <ChevronUp className="w-4 h-4 text-white/40" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded">
                        <X className="w-4 h-4 text-white/40" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px]">
                    {logs.length === 0 ? (
                        <div className="text-white/20 italic">No logs collected...</div>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="border-l border-white/10 pl-2 py-1">
                                <span className="text-white/30 mr-2">[{log.time}]</span>
                                <span className="text-white/70 break-all">{log.msg}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
