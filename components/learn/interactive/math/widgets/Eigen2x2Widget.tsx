"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "eigen2x2"; title?: string; A?: [[number, number], [number, number]] };

function eigenvalues2x2(A: [[number, number], [number, number]]) {
  const tr = A[0][0] + A[1][1];
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const disc = tr * tr - 4 * det;
  if (disc < 0) return { tr, det, disc, kind: "complex" as const };
  const s = Math.sqrt(disc);
  return { tr, det, disc, kind: "real" as const, l1: (tr + s) / 2, l2: (tr - s) / 2 };
}

function eigenvectorFor(A: [[number, number], [number, number]], lambda: number): [number, number] {
  const a = A[0][0] - lambda;
  const b = A[0][1];
  const c = A[1][0];
  const d = A[1][1] - lambda;
  const v1: [number, number] = Math.abs(a) + Math.abs(b) > 1e-12 ? [b, -a] : [d, -c];
  const n = Math.hypot(v1[0], v1[1]) || 1;
  return [v1[0] / n, v1[1] / n];
}

export function Eigen2x2Widget({ spec }: { spec: Spec }) {
  const [A, setA] = useState<[[number, number], [number, number]]>(
    () =>
      spec.A ?? [
        [2, 1],
        [1, 2],
      ],
  );
  const info = useMemo(() => eigenvalues2x2(A), [A]);

  const latexA = String.raw`A=\begin{pmatrix} ${fmt(A[0][0])} & ${fmt(A[0][1])} \\ ${fmt(
    A[1][0],
  )} & ${fmt(A[1][1])} \end{pmatrix}`;

  const latexPoly = String.raw`p(\lambda)=\det(A-\lambda I)=\lambda^2-(\mathrm{tr}\,A)\lambda+\det(A)`;

  const latexDisc = String.raw`\Delta=(\mathrm{tr}\,A)^2-4\det(A)=${fmt(info.disc)}`;

  const latexVals =
    info.kind === "real"
      ? String.raw`\lambda_{1,2}=\frac{\mathrm{tr}\,A\pm\sqrt{\Delta}}{2}=\left(${fmt(info.l1!)},\ ${fmt(
          info.l2!,
        )}\right)`
      : String.raw`\text{Complex eigenvalues (}\Delta<0\text{).}`;

  const vectors =
    info.kind === "real"
      ? {
          v1: eigenvectorFor(A, info.l1!),
          v2: eigenvectorFor(A, info.l2!),
        }
      : null;

  const latexVecs =
    vectors && info.kind === "real"
      ? String.raw`v_1\approx\begin{pmatrix}${fmt(vectors.v1[0], 4)}\\${fmt(
          vectors.v1[1],
          4,
        )}\end{pmatrix},\quad
v_2\approx\begin{pmatrix}${fmt(vectors.v2[0], 4)}\\${fmt(vectors.v2[1], 4)}\end{pmatrix}`
      : "";

  return (
    <InteractiveCard
      title={spec.title ?? "Eigenvalues (2×2)"}
      subtitle="Change A; observe trace/det and λ's."
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
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Math</div>
          <div className="text-sm">
            <Katex latex={latexA} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexPoly} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexDisc} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Results</div>
          <div className="text-sm">
            <Katex latex={latexVals} displayMode />
          </div>
          {vectors ? (
            <div className="text-sm">
              <Katex latex={latexVecs} displayMode />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              For 2×2 matrices, complex eigenvalues occur when{" "}
              <Katex latex={String.raw`\Delta<0`} />.
            </div>
          )}
        </div>
      </div>
    </InteractiveCard>
  );
}
