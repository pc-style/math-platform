"use client";

import React, { useMemo, useState } from "react";
import { Katex } from "@/components/learn/interactive/math/Katex";
import {
  InteractiveCard,
  NumberField,
  clamp01,
  fmt,
} from "@/components/learn/interactive/math/widgets/_ui";

type Spec = {
  kind: "bayes";
  title?: string;
  prior?: number;
  sensitivity?: number;
  specificity?: number;
};

export function BayesWidget({ spec }: { spec: Spec }) {
  const [prior, setPrior] = useState(spec.prior ?? 0.01);
  const [sensitivity, setSensitivity] = useState(spec.sensitivity ?? 0.95);
  const [specificity, setSpecificity] = useState(spec.specificity ?? 0.98);

  const info = useMemo(() => {
    const P_D = clamp01(prior);
    const sens = clamp01(sensitivity);
    const specv = clamp01(specificity);
    const P_pos_given_D = sens;
    const P_pos_given_notD = 1 - specv;
    const numer = P_pos_given_D * P_D;
    const denom = numer + P_pos_given_notD * (1 - P_D);
    const post = denom > 0 ? numer / denom : 0;
    return { P_D, sens, specv, post, P_pos_given_notD };
  }, [prior, sensitivity, specificity]);

  const latex = String.raw`\Pr(D\mid +)=\frac{\Pr(+\mid D)\Pr(D)}{\Pr(+\mid D)\Pr(D)+\Pr(+\mid \neg D)\Pr(\neg D)}`;
  const latexPlug = String.raw`\Pr(D\mid +)=\frac{${fmt(info.sens)}\cdot ${fmt(info.P_D)}}{${fmt(info.sens)}\cdot ${fmt(
    info.P_D,
  )}+${fmt(info.P_pos_given_notD)}\cdot ${fmt(1 - info.P_D)}}\approx ${fmt(info.post)}`;

  return (
    <InteractiveCard
      title={spec.title ?? "Bayes' Rule: Positive Test Posterior"}
      subtitle="Even great tests can mislead when priors are tiny."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Inputs</div>
          <NumberField
            label="prior P(D)"
            value={prior}
            onChange={setPrior}
            step={0.005}
            min={0}
            max={1}
          />
          <NumberField
            label="sensitivity P(+|D)"
            value={sensitivity}
            onChange={setSensitivity}
            step={0.01}
            min={0}
            max={1}
          />
          <NumberField
            label="specificity P(-|¬D)"
            value={specificity}
            onChange={setSpecificity}
            step={0.01}
            min={0}
            max={1}
          />
          <div className="text-xs text-muted-foreground">
            False positive rate:{" "}
            <Katex latex={String.raw`\Pr(+\mid \neg D)=1-\text{specificity}`} />.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Formula</div>
          <div className="text-sm">
            <Katex latex={latex} displayMode />
          </div>
          <div className="text-sm">
            <Katex latex={latexPlug} displayMode />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-mono text-muted-foreground">Interpretation</div>
          <div className="text-sm">
            Posterior <Katex latex={String.raw`\Pr(D\mid +)`} /> ≈{" "}
            <span className="font-mono text-primary">{fmt(info.post)}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Raising the prior usually matters more than tiny sensitivity gains.
          </div>
        </div>
      </div>
    </InteractiveCard>
  );
}
