"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import { InteractiveCard, NumberField, fmt } from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "derivativeDQ";
  title?: string;
  function?: "x^2" | "x^3" | "sin(x)" | "cos(x)" | "exp(x)" | "ln(1+x)";
  x0?: number;
  h?: number;
};

type FnKey = NonNullable<Spec["function"]>;

const functions: Record<
  FnKey,
  {
    label: string;
    latex: string;
    f: (x: number) => number;
    fprimeLatex: string;
    fprime: (x: number) => number;
  }
> = {
  "x^2": {
    label: "x^2",
    latex: String.raw`f(x)=x^2`,
    f: (x) => x * x,
    fprimeLatex: String.raw`f'(x)=2x`,
    fprime: (x) => 2 * x,
  },
  "x^3": {
    label: "x^3",
    latex: String.raw`f(x)=x^3`,
    f: (x) => x * x * x,
    fprimeLatex: String.raw`f'(x)=3x^2`,
    fprime: (x) => 3 * x * x,
  },
  "sin(x)": {
    label: "sin(x)",
    latex: String.raw`f(x)=\sin x`,
    f: (x) => Math.sin(x),
    fprimeLatex: String.raw`f'(x)=\cos x`,
    fprime: (x) => Math.cos(x),
  },
  "cos(x)": {
    label: "cos(x)",
    latex: String.raw`f(x)=\cos x`,
    f: (x) => Math.cos(x),
    fprimeLatex: String.raw`f'(x)=-\sin x`,
    fprime: (x) => -Math.sin(x),
  },
  "exp(x)": {
    label: "exp(x)",
    latex: String.raw`f(x)=e^x`,
    f: (x) => Math.exp(x),
    fprimeLatex: String.raw`f'(x)=e^x`,
    fprime: (x) => Math.exp(x),
  },
  "ln(1+x)": {
    label: "ln(1+x)",
    latex: String.raw`f(x)=\ln(1+x)`,
    f: (x) => Math.log(1 + x),
    fprimeLatex: String.raw`f'(x)=\frac{1}{1+x}`,
    fprime: (x) => 1 / (1 + x),
  },
};

export function DerivativeDQWidget({ spec }: { spec: Spec }) {
  const [fnKey, setFnKey] = useState<FnKey>(spec.function ?? "x^2");
  const [x0, setX0] = useState<number>(spec.x0 ?? 1);
  const [h, setH] = useState<number>(spec.h ?? 0.1);

  const info = useMemo(() => {
    const fn = functions[fnKey];
    const f0 = fn.f(x0);
    const f1 = fn.f(x0 + h);
    const dq = (f1 - f0) / h;
    const exact = fn.fprime(x0);
    return { dq, exact, err: dq - exact };
  }, [fnKey, x0, h]);

  const latexDQ = String.raw`\frac{f(x_0+h)-f(x_0)}{h}=\frac{f(${fmt(x0)}+${fmt(h)})-f(${fmt(x0)})}{${fmt(
    h,
  )}}\approx ${fmt(info.dq)}`;

  const latexExact = String.raw`${functions[fnKey].fprimeLatex},\quad f'(${fmt(x0)})=${fmt(info.exact)}`;
  const latexErr = String.raw`\text{error}=\text{DQ}-f'(x_0)\approx ${fmt(info.err)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Derivative via Difference Quotient"}
      subtitle="Shrink h to see the quotient converge to the true derivative."
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
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Inputs</div>
          <NumberField label="x0" value={x0} onChange={setX0} step={0.1} />
          <NumberField label="h" value={h} onChange={setH} step={0.01} />
          <div className="text-xs text-muted-foreground">
            Domain note: for <Katex latex={String.raw`\ln(1+x)`} />, require{" "}
            <Katex latex={String.raw`x>-1`} />.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Computation</div>
          <div className="text-sm">
            <Katex latex={latexDQ} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexExact} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexErr} displayMode />
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
