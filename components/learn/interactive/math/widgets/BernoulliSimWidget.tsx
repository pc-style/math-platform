"use client";

import React, { useMemo, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";
import { Katex } from "@/components/learn/interactive/math/Katex";
import {
  InteractiveCard,
  NumberField,
  clamp01,
  fmt,
} from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "bernoulliSim"; title?: string; p?: number; n?: number; trials?: number };

function simulateProportions(p: number, n: number, trials: number, bins: number) {
  const counts = Array.from({ length: bins }, () => 0);
  let sum = 0;
  let sumSq = 0;
  for (let t = 0; t < trials; t++) {
    let successes = 0;
    for (let i = 0; i < n; i++) {
      if (Math.random() < p) successes++;
    }
    const phat = successes / n;
    sum += phat;
    sumSq += phat * phat;
    const b = Math.min(bins - 1, Math.max(0, Math.floor(phat * (bins - 1) + 1e-12)));
    counts[b]++;
  }
  const mean = sum / trials;
  const variance = sumSq / trials - mean * mean;
  return { counts, mean, variance };
}

export function BernoulliSimWidget({ spec }: { spec: Spec }) {
  const isLowPerformance = usePerformanceMode();

  const [p, setP] = useState(spec.p ?? 0.5);
  const [n, setN] = useState(spec.n ?? 50);
  const [trials, setTrials] = useState(spec.trials ?? 500);
  const [lastRun, setLastRun] = useState<{
    counts: number[];
    mean: number;
    variance: number;
  } | null>(null);

  const safe = useMemo(() => {
    const P = clamp01(p);
    const N = Math.max(1, Math.min(1000, Math.floor(n)));
    const T = Math.max(10, Math.min(isLowPerformance ? 600 : 3000, Math.floor(trials)));
    return { P, N, T };
  }, [p, n, trials, isLowPerformance]);

  const bins = 21;
  const maxCount = Math.max(...(lastRun?.counts ?? [1]));

  const theoryVar = (safe.P * (1 - safe.P)) / safe.N;

  const latexModel = String.raw`X_i\sim\mathrm{Bern}(p),\quad \hat p=\frac{1}{n}\sum_{i=1}^n X_i`;
  const latexTheory = String.raw`\mathbb{E}[\hat p]=p,\quad \mathrm{Var}(\hat p)=\frac{p(1-p)}{n}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Bernoulli Simulation (LLN intuition)"}
      subtitle="Run trials; watch the distribution of p-hat concentrate near p."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Parameters</div>
          <NumberField label="p" value={p} onChange={setP} step={0.02} min={0} max={1} />
          <NumberField
            label="n (per trial)"
            value={n}
            onChange={setN}
            step={10}
            min={1}
            max={1000}
          />
          <NumberField
            label="trials"
            value={trials}
            onChange={setTrials}
            step={100}
            min={10}
            max={3000}
          />
          <button
            type="button"
            className="btn-premium w-full py-2 text-sm"
            onClick={() => setLastRun(simulateProportions(safe.P, safe.N, safe.T, bins))}
          >
            Run simulation
          </button>
          <div className="text-xs text-muted-foreground">
            Performance cap: trials ≤ {isLowPerformance ? 600 : 3000}.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Histogram of p-hat</div>
          <svg
            viewBox="0 0 320 160"
            className="w-full h-40 rounded-xl border border-white/10 bg-black/30"
          >
            {(lastRun?.counts ?? Array.from({ length: bins }, () => 0)).map((c, i) => {
              const w = 320 / bins;
              const h = (c / (maxCount || 1)) * 140;
              return (
                <rect
                  key={i}
                  x={i * w + 2}
                  y={150 - h}
                  width={Math.max(1, w - 4)}
                  height={h}
                  fill="rgba(255,0,255,0.55)"
                />
              );
            })}
          </svg>
          {lastRun ? (
            <div className="text-[10px] font-mono text-muted-foreground">
              sample mean ≈ {fmt(lastRun.mean, 4)}, sample var ≈ {fmt(lastRun.variance, 6)}
            </div>
          ) : (
            <div className="text-[10px] font-mono text-muted-foreground">
              Click “Run simulation” to generate data.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Theory</div>
          <div className="text-sm">
            <Katex latex={latexModel} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexTheory} displayMode />
          </div>
          <div className="text-xs text-muted-foreground">
            With p={fmt(safe.P, 4)} and n={safe.N}: Var(p-hat) ≈ {fmt(theoryVar, 6)}.
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
