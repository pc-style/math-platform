"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "dot2D"; title?: string; u?: [number, number]; v?: [number, number] };

export function DotProduct2DWidget({ spec }: { spec: Spec }) {
  const [u, setU] = useState<[number, number]>(spec.u ?? [2, 1]);
  const [v, setV] = useState<[number, number]>(spec.v ?? [1, 2]);

  const info = useMemo(() => {
    const dot = u[0] * v[0] + u[1] * v[1];
    const nu = Math.hypot(u[0], u[1]);
    const nv = Math.hypot(v[0], v[1]);
    const cos = nu > 0 && nv > 0 ? dot / (nu * nv) : NaN;
    const clamped = Number.isFinite(cos) ? Math.min(1, Math.max(-1, cos)) : NaN;
    const theta = Number.isFinite(clamped) ? Math.acos(clamped) : NaN;
    return { dot, nu, nv, cos, theta };
  }, [u, v]);

  const latex = String.raw`u\cdot v=u_1v_1+u_2v_2=${fmt(u[0])}\cdot${fmt(v[0])}+${fmt(u[1])}\cdot${fmt(
    v[1],
  )}=${fmt(info.dot)}`;
  const latexAngle = String.raw`\cos\theta=\frac{u\cdot v}{\|u\|\|v\|}\approx ${fmt(info.cos, 6)},\quad \theta\approx ${fmt(
    info.theta,
    6,
  )}\ \text{rad}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Dot Product & Angle (2D)"}
      subtitle="Change u and v; see dot product, norms, and angle."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Vector u</div>
          <NumberField
            label="u1"
            value={u[0]}
            onChange={(x) => setU((p) => [x, p[1]])}
            step={0.5}
          />
          <NumberField
            label="u2"
            value={u[1]}
            onChange={(y) => setU((p) => [p[0], y])}
            step={0.5}
          />
          <div className="text-xs text-muted-foreground">
            <Katex latex={String.raw`\|u\|=\sqrt{u_1^2+u_2^2}\approx ${fmt(info.nu)}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Vector v</div>
          <NumberField
            label="v1"
            value={v[0]}
            onChange={(x) => setV((p) => [x, p[1]])}
            step={0.5}
          />
          <NumberField
            label="v2"
            value={v[1]}
            onChange={(y) => setV((p) => [p[0], y])}
            step={0.5}
          />
          <div className="text-xs text-muted-foreground">
            <Katex latex={String.raw`\|v\|=\sqrt{v_1^2+v_2^2}\approx ${fmt(info.nv)}`} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Results</div>
          <div className="text-sm">
            <Katex latex={latex} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexAngle} displayMode />
          </div>
          <div className="text-xs text-muted-foreground">
            Orthogonal iff <Katex latex={String.raw`u\cdot v=0`} />.
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
