"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import {
  InteractiveCard,
  NumberField,
  clamp01,
  fmt,
} from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "binomial"; title?: string; n?: number; p?: number };

function choose(n: number, k: number) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let num = 1;
  let den = 1;
  for (let i = 1; i <= k; i++) {
    num *= n - (k - i);
    den *= i;
  }
  return num / den;
}

export function BinomialWidget({ spec }: { spec: Spec }) {
  const [n, setN] = useState<number>(spec.n ?? 10);
  const [p, setP] = useState<number>(spec.p ?? 0.5);

  const info = useMemo(() => {
    const N = Math.max(1, Math.min(50, Math.floor(n)));
    const P = clamp01(p);
    const probs = Array.from(
      { length: N + 1 },
      (_, k) => choose(N, k) * Math.pow(P, k) * Math.pow(1 - P, N - k),
    );
    const mean = N * P;
    const variance = N * P * (1 - P);
    return { N, P, probs, mean, variance };
  }, [n, p]);

  const maxProb = Math.max(...info.probs, 1e-9);

  const latex = String.raw`X\sim\mathrm{Bin}(n,p),\quad \Pr[X=k]=\binom{n}{k}p^k(1-p)^{n-k}`;
  const latexMoments = String.raw`\mathbb{E}[X]=np=${fmt(info.mean)},\quad \mathrm{Var}(X)=np(1-p)=${fmt(
    info.variance,
  )}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Binomial Distribution Explorer"}
      subtitle="Play with n and p; see PMF + moments."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Parameters</div>
          <NumberField label="n" value={n} onChange={setN} step={1} min={1} max={50} />
          <NumberField label="p" value={p} onChange={setP} step={0.05} min={0} max={1} />
          <div className="text-sm">
            <Katex latex={latex} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">PMF (bars)</div>
          <svg
            viewBox="0 0 320 160"
            className="w-full h-40 rounded-xl border border-white/10 bg-black/30"
          >
            {info.probs.map((pr, k) => {
              const w = 320 / info.probs.length;
              const h = (pr / maxProb) * 140;
              return (
                <rect
                  key={k}
                  x={k * w + 2}
                  y={150 - h}
                  width={Math.max(1, w - 4)}
                  height={h}
                  fill="rgba(255,0,255,0.55)"
                />
              );
            })}
          </svg>
          <div className="text-[10px] font-mono text-muted-foreground">
            Peak near <Katex latex={String.raw`k\approx np`} />.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Mean / variance</div>
          <div className="text-sm">
            <Katex latex={latexMoments} displayMode />
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
