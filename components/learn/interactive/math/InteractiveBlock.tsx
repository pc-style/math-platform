"use client";

import React, { useMemo } from "react";
import { MatrixMultiplyWidget } from "@/components/learn/interactive/math/widgets/MatrixMultiplyWidget";
import { Determinant2x2Widget } from "@/components/learn/interactive/math/widgets/Determinant2x2Widget";
import { LinearSystem2x2Widget } from "@/components/learn/interactive/math/widgets/LinearSystem2x2Widget";
import { Eigen2x2Widget } from "@/components/learn/interactive/math/widgets/Eigen2x2Widget";
import { DerivativeDQWidget } from "@/components/learn/interactive/math/widgets/DerivativeDQWidget";
import { RiemannSumWidget } from "@/components/learn/interactive/math/widgets/RiemannSumWidget";
import { TaylorWidget } from "@/components/learn/interactive/math/widgets/TaylorWidget";
import { BinomialWidget } from "@/components/learn/interactive/math/widgets/BinomialWidget";
import { BayesWidget } from "@/components/learn/interactive/math/widgets/BayesWidget";
import { BernoulliSimWidget } from "@/components/learn/interactive/math/widgets/BernoulliSimWidget";
import { NormalCdfWidget } from "@/components/learn/interactive/math/widgets/NormalCdfWidget";
import { DotProduct2DWidget } from "@/components/learn/interactive/math/widgets/DotProduct2DWidget";
import { LimitTableWidget } from "@/components/learn/interactive/math/widgets/LimitTableWidget";

type MatrixMultiplySpec = {
  kind: "matrixMultiply";
  title?: string;
  a?: number[][];
  b?: number[][];
};
type Determinant2x2Spec = {
  kind: "determinant2x2";
  title?: string;
  A?: [[number, number], [number, number]];
};
type LinearSystem2x2Spec = {
  kind: "linearSystem2x2";
  title?: string;
  A?: [[number, number], [number, number]];
  b?: [number, number];
};
type Eigen2x2Spec = { kind: "eigen2x2"; title?: string; A?: [[number, number], [number, number]] };
type DerivativeDQSpec = {
  kind: "derivativeDQ";
  title?: string;
  function?: "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  x0?: number;
  h?: number;
};
type RiemannSumSpec = {
  kind: "riemannSum";
  title?: string;
  function?: "x" | "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)";
  a?: number;
  b?: number;
  n?: number;
  method?: "left" | "right" | "midpoint";
};
type TaylorSpec = {
  kind: "taylor";
  title?: string;
  function?: "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  center?: number;
  degree?: number;
  x?: number;
};
type BinomialSpec = { kind: "binomial"; title?: string; n?: number; p?: number };
type BayesSpec = {
  kind: "bayes";
  title?: string;
  prior?: number;
  sensitivity?: number;
  specificity?: number;
};
type BernoulliSimSpec = {
  kind: "bernoulliSim";
  title?: string;
  p?: number;
  n?: number;
  trials?: number;
};
type NormalCdfSpec = { kind: "normalCdf"; title?: string; mu?: number; sigma?: number; x?: number };
type DotProduct2DSpec = {
  kind: "dot2D";
  title?: string;
  u?: [number, number];
  v?: [number, number];
};
type LimitTableSpec = {
  kind: "limitTable";
  title?: string;
  function?: "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  a?: number;
};

type InteractiveSpec = { kind: string; title?: string } & Record<string, unknown>;

function parseInteractiveSpec(raw: string): { spec?: InteractiveSpec; error?: string } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object")
      return { error: "Interactive block must be a JSON object." };
    const spec = parsed as { kind?: unknown };
    if (typeof spec.kind !== "string")
      return { error: "Interactive block missing string field `kind`." };
    return { spec: parsed as InteractiveSpec };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to parse interactive JSON." };
  }
}

export function InteractiveBlock({ raw }: { raw: string }) {
  const parsed = useMemo(() => parseInteractiveSpec(raw), [raw]);

  if (!parsed.spec) {
    return (
      <div className="glass border border-white/10 rounded-2xl p-4 my-6 not-prose">
        <div className="text-xs font-mono text-muted-foreground mb-2">
          Interactive block parse error
        </div>
        <pre className="text-xs overflow-auto">{parsed.error ?? "Unknown error"}</pre>
      </div>
    );
  }

  const spec = parsed.spec;

  switch (spec.kind) {
    case "matrixMultiply":
      return <MatrixMultiplyWidget spec={spec as unknown as MatrixMultiplySpec} />;
    case "determinant2x2":
      return <Determinant2x2Widget spec={spec as unknown as Determinant2x2Spec} />;
    case "linearSystem2x2":
      return <LinearSystem2x2Widget spec={spec as unknown as LinearSystem2x2Spec} />;
    case "eigen2x2":
      return <Eigen2x2Widget spec={spec as unknown as Eigen2x2Spec} />;
    case "derivativeDQ":
      return <DerivativeDQWidget spec={spec as unknown as DerivativeDQSpec} />;
    case "riemannSum":
      return <RiemannSumWidget spec={spec as unknown as RiemannSumSpec} />;
    case "taylor":
      return <TaylorWidget spec={spec as unknown as TaylorSpec} />;
    case "binomial":
      return <BinomialWidget spec={spec as unknown as BinomialSpec} />;
    case "bayes":
      return <BayesWidget spec={spec as unknown as BayesSpec} />;
    case "bernoulliSim":
      return <BernoulliSimWidget spec={spec as unknown as BernoulliSimSpec} />;
    case "normalCdf":
      return <NormalCdfWidget spec={spec as unknown as NormalCdfSpec} />;
    case "dot2D":
      return <DotProduct2DWidget spec={spec as unknown as DotProduct2DSpec} />;
    case "limitTable":
      return <LimitTableWidget spec={spec as unknown as LimitTableSpec} />;
    default:
      return (
        <div className="glass border border-white/10 rounded-2xl p-4 my-6 not-prose">
          <div className="text-xs font-mono text-muted-foreground mb-2">
            Interactive widget not implemented
          </div>
          <pre className="text-xs overflow-auto">{JSON.stringify(spec, null, 2)}</pre>
        </div>
      );
  }
}
