"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "determinant2x2"; title?: string; A?: [[number, number], [number, number]] };

function normalize2x2(
  A?: [[number, number], [number, number]],
): [[number, number], [number, number]] {
  return (
    A ?? [
      [2, 1],
      [3, 2],
    ]
  );
}

function det2x2(A: [[number, number], [number, number]]) {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function Determinant2x2Widget({ spec }: { spec: Spec }) {
  const [A, setA] = useState(() => normalize2x2(spec.A));
  const det = useMemo(() => det2x2(A), [A]);
  const invertible = Math.abs(det) > 1e-12;

  const latexA = String.raw`A=\begin{pmatrix} ${fmt(A[0][0])} & ${fmt(A[0][1])} \\ ${fmt(
    A[1][0],
  )} & ${fmt(A[1][1])} \end{pmatrix}`;
  const latexDet = String.raw`\det(A)=(${fmt(A[0][0])})(${fmt(A[1][1])})-(${fmt(A[0][1])})(${fmt(
    A[1][0],
  )})=${fmt(det)}`;

  const latexInv = invertible
    ? String.raw`A^{-1}=\frac{1}{\det(A)}\begin{pmatrix} ${fmt(A[1][1])} & ${fmt(-A[0][1])} \\ ${fmt(
        -A[1][0],
      )} & ${fmt(A[0][0])} \end{pmatrix}`
    : String.raw`A^{-1}\ \text{does not exist (singular matrix).}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Determinant & Invertibility (2×2)"}
      subtitle="Tune A; watch det(A) decide invertibility."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-2">
          <div className="text-xs font-mono text-muted-foreground mb-1">Matrix A</div>
          <NumberField
            label="a11"
            value={A[0][0]}
            onChange={(v) => setA((p) => [[v, p[0][1]], p[1]])}
          />
          <NumberField
            label="a12"
            value={A[0][1]}
            onChange={(v) => setA((p) => [[p[0][0], v], p[1]])}
          />
          <NumberField
            label="a21"
            value={A[1][0]}
            onChange={(v) => setA((p) => [p[0], [v, p[1][1]]])}
          />
          <NumberField
            label="a22"
            value={A[1][1]}
            onChange={(v) => setA((p) => [p[0], [p[1][0], v]])}
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono text-muted-foreground mb-1">Math</div>
          <div className="text-sm">
            <Katex latex={latexA} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexDet} displayMode />
          </div>
          <div className={`text-xs font-mono ${invertible ? "text-emerald-400" : "text-rose-400"}`}>
            {invertible ? "invertible (full rank)" : "singular (rank < 2)"}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono text-muted-foreground mb-1">Inverse (if any)</div>
          <div className="text-sm">
            <Katex latex={latexInv} displayMode />
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
