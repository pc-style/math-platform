"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Lightbulb, ChevronRight, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChallengeCardProps {
  title: string;
  description: string;
  hints: string[];
  difficulty: number;
  xpReward: number;
  onRun: () => void;
  onSubmit: () => void;
  onHintReveal?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  description,
  hints,
  difficulty,
  xpReward,
  onRun,
  onSubmit,
  onHintReveal,
}) => {
  const [showHintIndex, setShowHintIndex] = useState(-1);

  return (
    <div className="flex flex-col gap-6 h-full p-6 glass border border-white/10 rounded-2xl overflow-y-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold">
            Level {difficulty} Challenge
          </span>
          <span className="text-xs font-mono text-muted-foreground">+{xpReward} XP</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> {title}
        </h1>
      </div>

      {/* Description */}
      <div className="prose prose-invert max-w-none text-muted-foreground text-sm">
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>

      {/* Hints */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> Hints
        </h3>
        <div className="space-y-2">
          {hints.map((hint, idx) => (
            <div key={idx}>
              {idx <= showHintIndex ? (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground italic flex gap-3"
                >
                  <span className="text-primary font-bold">{idx + 1}.</span>
                  {hint}
                </motion.div>
              ) : idx === showHintIndex + 1 ? (
                <button
                  onClick={() => {
                    setShowHintIndex(idx);
                    onHintReveal?.();
                  }}
                  className="w-full p-3 rounded-xl border border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs text-muted-foreground text-left flex items-center justify-between group"
                >
                  Reveal Hint {idx + 1}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto pt-6 flex gap-4">
        <button
          onClick={onRun}
          className="flex-1 px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold tracking-tight"
        >
          Run Code
        </button>
        <button onClick={onSubmit} className="flex-[2] btn-premium py-3 group">
          Submit Solution
          <Check className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};
