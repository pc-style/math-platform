"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "riemannSum";
  title?: string;
  function?: "x" | "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)";
  a?: number;
  b?: number;
  n?: number;
  method?: "left" | "right" | "midpoint";
};

type FnKey = NonNullable<Spec["function"]>;

const functions: Record<FnKey, { label: string; latex: string; f: (x: number) => number }> = {
  x: { label: "x", latex: String.raw`f(x)=x`, f: (x) => x },
  "x^2": { label: "x^2", latex: String.raw`f(x)=x^2`, f: (x) => x * x },
  "x^3": { label: "x^3", latex: String.raw`f(x)=x^3`, f: (x) => x * x * x },
  "sin(x)": { label: "sin(x)", latex: String.raw`f(x)=\sin x`, f: (x) => Math.sin(x) },
  "cos(x)": { label: "cos(x)", latex: String.raw`f(x)=\cos x`, f: (x) => Math.cos(x) },
  "exp(x)": { label: "exp(x)", latex: String.raw`f(x)=e^x`, f: (x) => Math.exp(x) },
};

function sampleX(a: number, dx: number, i: number, method: "left" | "right" | "midpoint") {
  if (method === "left") return a + i * dx;
  if (method === "right") return a + (i + 1) * dx;
  return a + (i + 0.5) * dx;
}

export function RiemannSumWidget({ spec }: { spec: Spec }) {
  const [fnKey, setFnKey] = useState<FnKey>(spec.function ?? "x^2");
  const [a, setA] = useState(spec.a ?? 0);
  const [b, setB] = useState(spec.b ?? 1);
  const [n, setN] = useState(spec.n ?? 10);
  const [method, setMethod] = useState<NonNullable<Spec["method"]>>(spec.method ?? "midpoint");

  const info = useMemo(() => {
    const fn = functions[fnKey].f;
    const N = Math.max(1, Math.min(200, Math.floor(n)));
    const left = Math.min(a, b);
    const right = Math.max(a, b);
    const dx = (right - left) / N;
    let sum = 0;
    for (let i = 0; i < N; i++) {
      const x = sampleX(left, dx, i, method);
      sum += fn(x) * dx;
    }
    return { left, right, N, dx, sum };
  }, [fnKey, a, b, n, method]);

  const latex = String.raw`\Delta x=\frac{b-a}{n}=\frac{${fmt(info.right)}-${fmt(info.left)}}{${info.N}}=${fmt(
    info.dx,
  )},\quad S_n\approx \sum_{i=0}^{n-1} f(x_i^\*)\Delta x \approx ${fmt(info.sum)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Riemann Sum (Area Approximation)"}
      subtitle="Adjust n and method."
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
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Interval & partitions</div>
          <NumberField label="a" value={a} onChange={setA} step={0.1} />
          <NumberField label="b" value={b} onChange={setB} step={0.1} />
          <NumberField label="n" value={n} onChange={setN} step={1} min={1} max={200} />
          <div className="flex items-center justify-between gap-3 text-xs font-mono">
            <span className="text-muted-foreground">method</span>
            <select
              className="px-2 py-1 rounded-lg border border-white/10 bg-black/30"
              value={method}
              onChange={(e) => setMethod(e.target.value as NonNullable<Spec["method"]>)}
            >
              <option value="left">left</option>
              <option value="right">right</option>
              <option value="midpoint">midpoint</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Estimate</div>
          <div className="text-sm">
            <Katex latex={latex} displayMode />
          </div>
          <div className="text-xs text-muted-foreground">
            As <Katex latex={String.raw`n\to\infty`} />,{" "}
            <Katex latex={String.raw`S_n\to\int_a^b f(x)\,dx`} /> (when f is integrable).
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
