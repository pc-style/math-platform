"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "normalCdf"; title?: string; mu?: number; sigma?: number; x?: number };

function erf(x: number) {
  // Abramowitz & Stegun 7.1.26 approximation
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function phi(z: number) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

export function NormalCdfWidget({ spec }: { spec: Spec }) {
  const [mu, setMu] = useState(spec.mu ?? 0);
  const [sigma, setSigma] = useState(spec.sigma ?? 1);
  const [x, setX] = useState(spec.x ?? 1.96);

  const info = useMemo(() => {
    const s = sigma <= 0 ? 1e-9 : sigma;
    const z = (x - mu) / s;
    const p = phi(z);
    return { s, z, p };
  }, [mu, sigma, x]);

  const latexZ = String.raw`Z=\frac{X-\mu}{\sigma},\quad z=\frac{x-\mu}{\sigma}=\frac{${fmt(x)}-${fmt(mu)}}{${fmt(
    info.s,
  )}}=${fmt(info.z)}`;
  const latexCdf = String.raw`\Pr(X\le x)=\Phi(z)\approx ${fmt(info.p, 6)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Normal CDF (z-score)"}
      subtitle="Compute P(X ≤ x) for N(μ, σ²)."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Parameters</div>
          <NumberField label="μ" value={mu} onChange={setMu} step={0.5} />
          <NumberField label="σ" value={sigma} onChange={setSigma} step={0.5} min={0.001} />
          <NumberField label="x" value={x} onChange={setX} step={0.5} />
          <div className="text-xs text-muted-foreground">
            Uses an <Katex latex={String.raw`\mathrm{erf}`} /> approximation; good for intuition +
            quick checks.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Standardize</div>
          <div className="text-sm">
            <Katex latex={latexZ} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Probability</div>
          <div className="text-sm">
            <Katex latex={latexCdf} displayMode />
          </div>
          <div className="text-xs text-muted-foreground">
            Two-sided tail: <Katex latex={String.raw`\Pr(|Z|\ge |z|)=2(1-\Phi(|z|))`} />.
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
