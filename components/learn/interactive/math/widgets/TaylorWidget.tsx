"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "taylor";
  title?: string;
  function?: "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  center?: number;
  degree?: number;
  x?: number;
};

type FnKey = NonNullable<Spec["function"]>;

const functions: Record<
  FnKey,
  {
    label: string;
    latex: string;
    f: (x: number) => number;
    seriesAt0: (n: number, x: number) => number;
    seriesLatex: string;
  }
> = {
  "sin(x)": {
    label: "sin(x)",
    latex: String.raw`f(x)=\sin x`,
    f: (x) => Math.sin(x),
    seriesAt0: (n, x) => {
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const p = 2 * k + 1;
        let fact = 1;
        for (let i = 2; i <= p; i++) fact *= i;
        s += ((k % 2 === 0 ? 1 : -1) * Math.pow(x, p)) / fact;
      }
      return s;
    },
    seriesLatex: String.raw`\sin x=\sum_{k=0}^{\infty}(-1)^k\frac{x^{2k+1}}{(2k+1)!}`,
  },
  "cos(x)": {
    label: "cos(x)",
    latex: String.raw`f(x)=\cos x`,
    f: (x) => Math.cos(x),
    seriesAt0: (n, x) => {
      let s = 0;
      for (let k = 0; k <= n; k++) {
        const p = 2 * k;
        let fact = 1;
        for (let i = 2; i <= p; i++) fact *= i;
        s += ((k % 2 === 0 ? 1 : -1) * Math.pow(x, p)) / fact;
      }
      return s;
    },
    seriesLatex: String.raw`\cos x=\sum_{k=0}^{\infty}(-1)^k\frac{x^{2k}}{(2k)!}`,
  },
  "exp(x)": {
    label: "exp(x)",
    latex: String.raw`f(x)=e^x`,
    f: (x) => Math.exp(x),
    seriesAt0: (n, x) => {
      let s = 0;
      for (let k = 0; k <= n; k++) {
        let fact = 1;
        for (let i = 2; i <= k; i++) fact *= i;
        s += Math.pow(x, k) / fact;
      }
      return s;
    },
    seriesLatex: String.raw`e^x=\sum_{k=0}^{\infty}\frac{x^k}{k!}`,
  },
  "ln(1+x)": {
    label: "ln(1+x)",
    latex: String.raw`f(x)=\ln(1+x)`,
    f: (x) => Math.log(1 + x),
    seriesAt0: (n, x) => {
      let s = 0;
      for (let k = 1; k <= n + 1; k++) {
        s += ((k % 2 === 1 ? 1 : -1) * Math.pow(x, k)) / k;
      }
      return s;
    },
    seriesLatex: String.raw`\ln(1+x)=\sum_{k=1}^{\infty}(-1)^{k+1}\frac{x^k}{k}\quad(|x|<1)`,
  },
};

export function TaylorWidget({ spec }: { spec: Spec }) {
  const [fnKey, setFnKey] = useState<FnKey>(spec.function ?? "exp(x)");
  const [degree, setDegree] = useState<number>(spec.degree ?? 4);
  const [x, setX] = useState<number>(spec.x ?? 0.5);
  const center = spec.center ?? 0;

  const info = useMemo(() => {
    const fn = functions[fnKey];
    const n = Math.max(0, Math.min(12, Math.floor(degree)));
    const p = fn.seriesAt0(n, x - center);
    const exact = fn.f(x);
    return { n, p, exact, err: p - exact };
  }, [fnKey, degree, x, center]);

  const latexSeries = functions[fnKey].seriesLatex;
  const latexEval = String.raw`P_{${info.n}}(${fmt(x)})\approx ${fmt(info.p)},\quad f(${fmt(x)})=${fmt(
    info.exact,
  )},\quad \text{error}\approx ${fmt(info.err)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Taylor Series Approximation"}
      subtitle="Increase degree to reduce error."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Function</div>
          <select
            className="w-full px-2 py-2 rounded-lg border border-white/10 bg-black/30 text-sm"
            value={fnKey}
            onChange={(e) => setFnKey(e.target.value as FnKey)}
          >
            {Object.keys(functions).map((k) => (
              <option key={k} value={k}>
                {functions[k as FnKey].label}
              </option>
            ))}
          </select>
          <div className="text-sm">
            <Katex latex={functions[fnKey].latex} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexSeries} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Inputs</div>
          <NumberField
            label="degree (n)"
            value={degree}
            onChange={setDegree}
            step={1}
            min={0}
            max={12}
          />
          <NumberField label="x" value={x} onChange={setX} step={0.1} />
          <div className="text-xs text-muted-foreground">
            Uses the Maclaurin expansion (center <Katex latex="0" />
            ). For <Katex latex={String.raw`\ln(1+x)`} />, keep <Katex latex={String.raw`|x|<1`} />{" "}
            for convergence.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Approximation</div>
          <div className="text-sm">
            <Katex latex={latexEval} displayMode />
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
