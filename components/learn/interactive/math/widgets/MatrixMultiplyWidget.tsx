"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = { kind: "matrixMultiply"; title?: string; a?: number[][]; b?: number[][] };

function normalize2x2(m?: number[][]): [[number, number], [number, number]] {
  const v = m ?? [
    [1, 2],
    [3, 4],
  ];
  return [
    [Number(v?.[0]?.[0] ?? 1), Number(v?.[0]?.[1] ?? 2)],
    [Number(v?.[1]?.[0] ?? 3), Number(v?.[1]?.[1] ?? 4)],
  ];
}

function multiply2x2(
  A: [[number, number], [number, number]],
  B: [[number, number], [number, number]],
): [[number, number], [number, number]] {
  return [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
}

export function MatrixMultiplyWidget({ spec }: { spec: Spec }) {
  const initialA = useMemo(() => normalize2x2(spec.a), [spec.a]);
  const initialB = useMemo(() => normalize2x2(spec.b), [spec.b]);

  const [A, setA] = useState(initialA);
  const [B, setB] = useState(initialB);

  const C = useMemo(() => multiply2x2(A, B), [A, B]);

  const latex = String.raw`A=\begin{pmatrix} ${fmt(A[0][0])} & ${fmt(A[0][1])} \\ ${fmt(
    A[1][0],
  )} & ${fmt(A[1][1])} \end{pmatrix},\quad B=\begin{pmatrix} ${fmt(B[0][0])} & ${fmt(
    B[0][1],
  )} \\ ${fmt(B[1][0])} & ${fmt(B[1][1])} \end{pmatrix}`;

  const latexC = String.raw`AB=\begin{pmatrix} ${fmt(C[0][0])} & ${fmt(C[0][1])} \\ ${fmt(
    C[1][0],
  )} & ${fmt(C[1][1])} \end{pmatrix}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Matrix Multiplication (2×2)"}
      subtitle="Edit entries; watch AB update in real time."
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
          <div className="text-xs font-mono text-muted-foreground mb-1">Matrix B</div>
          <NumberField
            label="b11"
            value={B[0][0]}
            onChange={(v) => setB((p) => [[v, p[0][1]], p[1]])}
          />
          <NumberField
            label="b12"
            value={B[0][1]}
            onChange={(v) => setB((p) => [[p[0][0], v], p[1]])}
          />
          <NumberField
            label="b21"
            value={B[1][0]}
            onChange={(v) => setB((p) => [p[0], [v, p[1][1]]])}
          />
          <NumberField
            label="b22"
            value={B[1][1]}
            onChange={(v) => setB((p) => [p[0], [p[1][0], v]])}
          />
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground mb-1">Result</div>
          <div className="space-y-2">
            <div className="text-sm leading-relaxed">
              <Katex latex={latex} displayMode />
            </div>
            <div className="text-sm leading-relaxed">
              <Katex latex={latexC} displayMode />
            </div>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
