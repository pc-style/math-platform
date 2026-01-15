"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Calendar,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  XCircle,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

type DailyQuestEventMap = {
  "learn:challengeAttempt": { challengeId?: string; slug?: string };
  "learn:challengeSuccess": {
    xpEarned: number;
    usedHint?: boolean;
    challengeId?: string;
    slug?: string;
  };
  "learn:challengeFailure": { challengeId?: string; slug?: string };
};

type QuestType =
  | "complete_challenges"
  | "earn_xp"
  | "submit_attempts"
  | "no_hint_clear"
  | "wrong_answers";

type QuestDefinition = {
  id: QuestType;
  title: string;
  description: string;
  target: number;
  icon: React.ComponentType<{ className?: string }>;
};

type QuestProgress = {
  id: QuestType;
  progress: number;
  completedAt?: number;
};

type DailyQuestSaveV1 = {
  version: 1;
  dateKey: string;
  selected: QuestType[];
  progress: Record<QuestType, QuestProgress>;
  rewardClaimed: boolean;
};

const QUEST_POOL: QuestDefinition[] = [
  {
    id: "complete_challenges",
    title: "First Blood",
    description: "Complete challenges to keep your streak alive.",
    target: 1,
    icon: Swords,
  },
  {
    id: "earn_xp",
    title: "XP Hunter",
    description: "Earn XP from wins and theory clears.",
    target: 200,
    icon: Target,
  },
  {
    id: "submit_attempts",
    title: "Persistence Pays",
    description: "Submit solutions. Momentum beats hesitation.",
    target: 5,
    icon: ShieldCheck,
  },
  {
    id: "no_hint_clear",
    title: "No-Hint Hero",
    description: "Clear a challenge without revealing hints.",
    target: 1,
    icon: Sparkles,
  },
  {
    id: "wrong_answers",
    title: "Glitch Training",
    description: "Miss a couple. Learn the edges. Come back sharper.",
    target: 2,
    icon: XCircle,
  },
];

const pad2 = (n: number) => `${n}`.padStart(2, "0");
const getLocalDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const hashStringToSeed = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const pickDailyQuests = (seedKey: string, count: number): QuestType[] => {
  const seed = hashStringToSeed(seedKey);
  const rand = mulberry32(seed);
  const pool = [...QUEST_POOL.map((q) => q.id)];
  const picked: QuestType[] = [];
  while (picked.length < Math.min(count, pool.length)) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return picked;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

const createFreshSave = (dateKey: string, seedKey: string): DailyQuestSaveV1 => {
  const selected = pickDailyQuests(seedKey, 3);
  const base: DailyQuestSaveV1["progress"] = {
    complete_challenges: { id: "complete_challenges", progress: 0 },
    earn_xp: { id: "earn_xp", progress: 0 },
    submit_attempts: { id: "submit_attempts", progress: 0 },
    no_hint_clear: { id: "no_hint_clear", progress: 0 },
    wrong_answers: { id: "wrong_answers", progress: 0 },
  };

  return { version: 1, dateKey, selected, progress: base, rewardClaimed: false };
};

const safeParse = (raw: string | null): DailyQuestSaveV1 | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DailyQuestSaveV1;
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
};

export function DailyQuests({ userId }: { userId?: string }) {
  const isLowPerformance = usePerformanceMode();
  const addXp = useMutation(api.users.addXp);
  const storageKey = `learn_dailyQuests_v1:${userId || "anon"}`;
  const seedKey = `${userId || "anon"}:${getLocalDateKey()}`;

  const [save, setSave] = useState<DailyQuestSaveV1 | null>(() => {
    if (typeof window === "undefined") return null;
    const dateKey = getLocalDateKey();
    const existing = safeParse(localStorage.getItem(storageKey));
    if (existing && existing.dateKey === dateKey) {
      return existing;
    }
    const next = createFreshSave(dateKey, seedKey);
    localStorage.setItem(storageKey, JSON.stringify(next));
    return next;
  });

  const [pulseQuest, setPulseQuest] = useState<string | null>(null);

  useEffect(() => {
    if (!save) return;
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const delay = Math.max(1, nextMidnight.getTime() - now.getTime());

    const timer = window.setTimeout(() => {
      const dateKey = getLocalDateKey();
      const next = createFreshSave(dateKey, `${userId || "anon"}:${dateKey}`);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSave(next);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [save, storageKey, userId]);

  useEffect(() => {
    if (!save) return;
    localStorage.setItem(storageKey, JSON.stringify(save));
  }, [save, storageKey]);

  const updateQuest = useCallback(
    (id: QuestType, delta: number, meta?: { completedAt?: number }) => {
      setSave((prev) => {
        if (!prev) return prev;
        const current = prev.progress[id];
        const def = QUEST_POOL.find((q) => q.id === id);
        if (!current || !def) return prev;

        const wasComplete = current.progress >= def.target;
        const nextProgress = clamp(current.progress + delta, 0, def.target);
        const didComplete = !wasComplete && nextProgress >= def.target;
        const completedAt = didComplete ? meta?.completedAt || Date.now() : current.completedAt;

        const next: DailyQuestSaveV1 = {
          ...prev,
          progress: {
            ...prev.progress,
            [id]: { ...current, progress: nextProgress, ...(completedAt ? { completedAt } : {}) },
          },
        };

        if (didComplete) {
          setPulseQuest(id);
          window.setTimeout(() => setPulseQuest((p) => (p === id ? null : p)), 750);
        }

        return next;
      });
    },
    [],
  );

  const onEvent = useCallback(
    <K extends keyof DailyQuestEventMap>(
      eventName: K,
      handler: (d: DailyQuestEventMap[K]) => void,
    ) => {
      const listener = (evt: Event) => {
        const e = evt as CustomEvent<DailyQuestEventMap[K]>;
        handler(e.detail);
      };
      window.addEventListener(eventName, listener as EventListener);
      return () => window.removeEventListener(eventName, listener as EventListener);
    },
    [],
  );

  useEffect(() => {
    if (!save) return;

    const cleanups: Array<() => void> = [];
    cleanups.push(
      onEvent("learn:challengeAttempt", () => {
        updateQuest("submit_attempts", 1);
      }),
    );
    cleanups.push(
      onEvent("learn:challengeFailure", () => {
        updateQuest("wrong_answers", 1);
      }),
    );
    cleanups.push(
      onEvent("learn:challengeSuccess", (d) => {
        if (d.xpEarned > 0) updateQuest("complete_challenges", 1);
        if (d.xpEarned > 0) updateQuest("earn_xp", d.xpEarned);
        if (d.usedHint === false && d.xpEarned > 0) updateQuest("no_hint_clear", 1);
      }),
    );

    return () => cleanups.forEach((fn) => fn());
  }, [onEvent, save, updateQuest]);

  const selectedDefs = useMemo(() => {
    if (!save) return [];
    return save.selected
      .map((id) => QUEST_POOL.find((q) => q.id === id))
      .filter((q): q is QuestDefinition => Boolean(q));
  }, [save]);

  const allCompleted = useMemo(() => {
    if (!save) return false;
    return selectedDefs.every((q) => save.progress[q.id].progress >= q.target);
  }, [save, selectedDefs]);

  const rewardXp = 150;

  const handleClaim = async () => {
    if (!save || save.rewardClaimed || !allCompleted) return;
    setSave({ ...save, rewardClaimed: true });
    await addXp({ amount: rewardXp });

    if (!isLowPerformance) {
      confetti({
        particleCount: 120,
        spread: 70,
        startVelocity: 45,
        origin: { y: 0.85 },
        colors: ["#ff00ff", "#00ffff", "#ffffff"],
      });
      confetti({
        particleCount: 50,
        spread: 120,
        startVelocity: 30,
        decay: 0.9,
        origin: { y: 0.75 },
        colors: ["#ff00ff", "#ff7bff", "#00ffff"],
      });
    }
  };

  if (!save) {
    return (
      <div className="p-4 glass border border-white/10 rounded-2xl text-sm text-muted-foreground">
        Loading quests…
      </div>
    );
  }

  return (
    <div className="p-4 glass border border-white/10 rounded-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight">Daily Quests</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Today: <span className="font-mono">{save.dateKey}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Reward</div>
          <div className="text-xs font-mono text-foreground/90">+{rewardXp} XP</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {selectedDefs.map((q) => {
          const p = save.progress[q.id];
          const ratio = q.target === 0 ? 1 : p.progress / q.target;
          const isDone = p.progress >= q.target;
          const Icon = q.icon;

          return (
            <motion.div
              key={q.id}
              layout
              initial={false}
              animate={
                pulseQuest === q.id
                  ? {
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        "0 0 0 rgba(0,0,0,0)",
                        "0 0 30px rgba(255,0,255,0.25)",
                        "0 0 0 rgba(0,0,0,0)",
                      ],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.55, type: "spring", stiffness: 260, damping: 22 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/15 p-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`relative w-9 h-9 rounded-xl border flex items-center justify-center ${
                    isDone ? "bg-primary/15 border-primary/40" : "bg-white/5 border-white/10"
                  }`}
                >
                  <motion.div
                    aria-hidden="true"
                    className="absolute -inset-2 rounded-2xl blur-xl"
                    animate={isDone ? { opacity: [0.25, 0.6, 0.3] } : { opacity: 0 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      background:
                        "radial-gradient(circle at 50% 60%, rgba(255,0,255,0.35), rgba(0,255,255,0.18), rgba(0,0,0,0))",
                    }}
                  />
                  <Icon
                    className={`relative w-4 h-4 ${isDone ? "text-primary" : "text-foreground/80"}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-tight truncate">{q.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-snug">
                        {q.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {p.progress}/{q.target}
                      </div>
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-primary" /> : null}
                    </div>
                  </div>

                  <div className="mt-2 h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px] relative">
                    <motion.div
                      initial={false}
                      animate={{ width: `${clamp(ratio * 100, 0, 100)}%` }}
                      transition={{ type: "spring", stiffness: 160, damping: 26 }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_18px_rgba(255,0,255,0.35)]"
                    />
                  </div>
                </div>
              </div>

              <motion.div
                aria-hidden="true"
                className="absolute inset-0 opacity-0"
                animate={
                  isDone
                    ? { opacity: [0.08, 0.16, 0.1], backgroundPositionX: ["0%", "100%"] }
                    : { opacity: 0 }
                }
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(255,0,255,0), rgba(255,0,255,0.20), rgba(0,255,255,0.16), rgba(255,0,255,0))",
                  backgroundSize: "180% 100%",
                }}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="mt-4">
        <AnimatePresence initial={false}>
          {allCompleted && !save.rewardClaimed ? (
            <motion.button
              type="button"
              key="claim"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClaim}
              className="w-full btn-premium py-3 flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              Claim Reward
            </motion.button>
          ) : null}
        </AnimatePresence>

        {allCompleted && save.rewardClaimed ? (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-[11px] text-foreground/90 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Reward claimed. New quests arrive tomorrow.
          </div>
        ) : null}
      </div>
    </div>
  );
}
