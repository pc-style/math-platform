"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "linearSystem2x2";
  title?: string;
  A?: [[number, number], [number, number]];
  b?: [number, number];
};

function det2(A: [[number, number], [number, number]]) {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

export function LinearSystem2x2Widget({ spec }: { spec: Spec }) {
  const [A, setA] = useState<[[number, number], [number, number]]>(
    () =>
      spec.A ?? [
        [2, 1],
        [1, 3],
      ],
  );
  const [b, setB] = useState<[number, number]>(() => spec.b ?? [1, 2]);

  const solution = useMemo(() => {
    const d = det2(A);
    if (Math.abs(d) < 1e-12) return { status: "singular" as const, det: d };
    const x = (b[0] * A[1][1] - A[0][1] * b[1]) / d;
    const y = (A[0][0] * b[1] - b[0] * A[1][0]) / d;
    return { status: "unique" as const, det: d, x, y };
  }, [A, b]);

  const latexSystem = String.raw`\begin{cases}
${fmt(A[0][0])}x + ${fmt(A[0][1])}y = ${fmt(b[0])}\\
${fmt(A[1][0])}x + ${fmt(A[1][1])}y = ${fmt(b[1])}
\end{cases}`;

  const latexMatrix = String.raw`Ax=b,\quad A=\begin{pmatrix} ${fmt(A[0][0])} & ${fmt(A[0][1])} \\ ${fmt(
    A[1][0],
  )} & ${fmt(A[1][1])} \end{pmatrix},\ b=\begin{pmatrix} ${fmt(b[0])} \\ ${fmt(b[1])} \end{pmatrix}`;

  const latexSol =
    solution.status === "unique"
      ? String.raw`(x,y)=\left(${fmt(solution.x!)},\ ${fmt(solution.y!)}\right)`
      : String.raw`\text{No unique solution: }\det(A)=${fmt(solution.det)}.`;

  return (
    <InteractiveCard
      title={spec.title ?? "Solve a 2×2 Linear System"}
      subtitle="Edit A and b; solve instantly via Cramer's rule."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Matrix A</div>
          <div className="grid grid-cols-2 gap-2">
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
          <div className="text-xs font-mono text-muted-foreground mt-2">Vector b</div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="b1" value={b[0]} onChange={(v) => setB((p) => [v, p[1]])} />
            <NumberField label="b2" value={b[1]} onChange={(v) => setB((p) => [p[0], v])} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">System</div>
          <div className="text-sm">
            <Katex latex={latexSystem} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexMatrix} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Solution</div>
          <div className="text-sm">
            <Katex latex={latexSol} displayMode />
          </div>
          <div className="text-xs text-muted-foreground">
            Unique solution iff <Katex latex={String.raw`\det(A)\neq 0`} />.
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
