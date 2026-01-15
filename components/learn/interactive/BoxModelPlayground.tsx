"use client";

import React, { useMemo, useState } from "react";

const MIN_SPACE = 0;
const MAX_SPACE = 80;

export const BoxModelPlayground: React.FC = () => {
  const [padding, setPadding] = useState(24);
  const [margin, setMargin] = useState(16);

  const style = useMemo(
    () => ({
      padding: `${padding}px`,
      margin: `${margin}px`,
    }),
    [padding, margin],
  );

  return (
    <section className="flex flex-col gap-6 h-full p-6 glass border border-white/10 rounded-2xl overflow-hidden">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.3em] text-primary/80 font-bold">
          Interactive Lab
        </span>
        <h2 className="text-2xl font-bold text-foreground">Box Model Playground</h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Drag the sliders to see how margin and padding reshape the element footprint.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <label className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              Padding
              <span className="text-primary font-mono">{padding}px</span>
            </label>
            <input
              type="range"
              min={MIN_SPACE}
              max={MAX_SPACE}
              step={2}
              value={padding}
              onChange={(event) => setPadding(Number(event.target.value))}
              className="accent-primary w-full mt-3"
            />
          </div>

          <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
            <label className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              Margin
              <span className="text-primary font-mono">{margin}px</span>
            </label>
            <input
              type="range"
              min={MIN_SPACE}
              max={MAX_SPACE}
              step={2}
              value={margin}
              onChange={(event) => setMargin(Number(event.target.value))}
              className="accent-primary w-full mt-3"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-4 text-xs font-mono text-muted-foreground">
            <div className="text-primary">CSS Snapshot</div>
            <pre className="mt-2 text-[11px] leading-relaxed">
              {`margin: ${margin}px;\npadding: ${padding}px;`}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/70 p-4 min-h-[320px]">
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="border border-dashed border-primary/40 text-[10px] uppercase tracking-[0.2em] text-primary/80"
              style={{ margin: style.margin }}
            >
              <div
                className="rounded-xl border border-white/10 bg-white/5"
                style={{ padding: style.padding }}
              >
                <div className="rounded-lg border border-primary/50 bg-black/70 px-4 py-3 text-primary font-mono text-xs">
                  Content Box
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>Margin controls the space outside the border.</span>
        <span>Padding controls the space between border and content.</span>
      </footer>
    </section>
  );
};

export default BoxModelPlayground;
