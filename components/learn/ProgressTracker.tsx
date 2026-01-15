"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Trophy } from "lucide-react";

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
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
          <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold">{streak} Day Streak</span>
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
