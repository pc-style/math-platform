"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "limitTable";
  title?: string;
  function?: "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  a?: number;
};

type FnKey = NonNullable<Spec["function"]>;

const functions: Record<FnKey, { label: string; latex: string; f: (x: number) => number }> = {
  "x^2": { label: "x^2", latex: String.raw`f(x)=x^2`, f: (x) => x * x },
  "x^3": { label: "x^3", latex: String.raw`f(x)=x^3`, f: (x) => x * x * x },
  "sin(x)": { label: "sin(x)", latex: String.raw`f(x)=\sin x`, f: (x) => Math.sin(x) },
  "cos(x)": { label: "cos(x)", latex: String.raw`f(x)=\cos x`, f: (x) => Math.cos(x) },
  "exp(x)": { label: "exp(x)", latex: String.raw`f(x)=e^x`, f: (x) => Math.exp(x) },
  "ln(1+x)": { label: "ln(1+x)", latex: String.raw`f(x)=\ln(1+x)`, f: (x) => Math.log(1 + x) },
};

export function LimitTableWidget({ spec }: { spec: Spec }) {
  const [fnKey, setFnKey] = useState<FnKey>(spec.function ?? "sin(x)");
  const [a, setA] = useState<number>(spec.a ?? 0);

  const table = useMemo(() => {
    const fn = functions[fnKey].f;
    const hs = [1, 0.5, 0.2, 0.1, 0.05, 0.01];
    return hs.map((h) => {
      const xL = a - h;
      const xR = a + h;
      const fL = fn(xL);
      const fR = fn(xR);
      return { h, xL, xR, fL, fR };
    });
  }, [fnKey, a]);

  const latexGoal = String.raw`\lim_{x\to a} f(x)\ \text{(try to guess by looking at }x=a\pm h\text{)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Limit Table Explorer"}
      subtitle="Approach a from both sides."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Choose f</div>
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
          <NumberField label="a" value={a} onChange={setA} step={0.1} />
          <div className="text-xs text-muted-foreground">
            Domain note: for <Katex latex={String.raw`\ln(1+x)`} />, require{" "}
            <Katex latex={String.raw`a>-1`} /> and points <Katex latex={String.raw`a\pm h>-1`} />.
          </div>
        </div>

        <div className="space-y-3 md:col-span-2">
          <div className="text-xs font-mono text-muted-foreground">Table</div>
          <div className="text-sm">
            <Katex latex={latexGoal} displayMode />
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
            <table className="min-w-full text-xs font-mono">
              <thead className="text-muted-foreground">
                <tr className="border-b border-white/10">
                  <th className="text-left p-2">h</th>
                  <th className="text-left p-2">x=a-h</th>
                  <th className="text-left p-2">f(a-h)</th>
                  <th className="text-left p-2">x=a+h</th>
                  <th className="text-left p-2">f(a+h)</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row) => (
                  <tr key={row.h} className="border-b border-white/5">
                    <td className="p-2">{fmt(row.h, 4)}</td>
                    <td className="p-2">{fmt(row.xL, 6)}</td>
                    <td className="p-2">{fmt(row.fL, 6)}</td>
                    <td className="p-2">{fmt(row.xR, 6)}</td>
                    <td className="p-2">{fmt(row.fR, 6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
