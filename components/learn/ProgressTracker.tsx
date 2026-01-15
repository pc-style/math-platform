"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

interface ProgressTrackerProps {
  xp: number;
  level: number;
  streak: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ xp, level, streak }) => {
  const progress = (xp % 1000) / 10; // Simple XP logic

  return (
    <div className="flex flex-col gap-4 p-4 glass border border-white/10 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">
              Level {level}
            </span>
            <span className="text-sm font-bold tracking-tight">{xp} XP</span>
          </div>
        </div>
        <div className="relative flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5 overflow-hidden">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 opacity-70"
            animate={{
              backgroundPositionX: ["0%", "100%"],
              opacity: [0.35, 0.7, 0.45],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(255,0,255,0.0), rgba(255,0,255,0.22), rgba(255,165,0,0.22), rgba(255,255,0,0.14), rgba(255,0,255,0.0))",
              backgroundSize: "180% 100%",
            }}
          />
          <div className="relative flex items-center gap-2">
            <div className="relative w-4 h-4">
              <motion.div
                aria-hidden="true"
                className="absolute -inset-1 rounded-full blur-md"
                animate={{ scale: [1, 1.25, 1.05], opacity: [0.5, 0.9, 0.55] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 50% 70%, rgba(255,255,0,0.85), rgba(255,140,0,0.55), rgba(255,0,255,0.2), rgba(0,0,0,0))",
                }}
              />
              <motion.div
                aria-hidden="true"
                className="absolute -inset-0.5 rounded-full blur-sm"
                animate={{ scaleY: [1, 1.35, 1.1], rotate: [-6, 6, -3] }}
                transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 50% 80%, rgba(255,170,0,0.6), rgba(255,0,255,0.35), rgba(0,0,0,0))",
                }}
              />
              <Flame className="relative w-4 h-4 text-yellow-300 drop-shadow-[0_0_10px_rgba(255,165,0,0.7)]" />
            </div>
            <span className="text-xs font-bold">
              {streak} Day{streak === 1 ? "" : "s"} Streak
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Progress</span>
          <span>{xp % 1000} / 1000</span>
        </div>
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            className="absolute inset-y-[1px] left-[1px] rounded-full bg-primary/40 blur-md"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full shadow-[0_0_18px_rgba(255,0,255,0.5)] animate-pulse-glow"
          />
        </div>
      </div>
    </div>
  );
};
