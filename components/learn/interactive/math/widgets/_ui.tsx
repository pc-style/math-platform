"use client";

import React from "react";

export function InteractiveCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass border border-white/10 rounded-2xl p-5 my-6 not-prose">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-sm font-semibold tracking-tight">{title}</div>
          {subtitle ? <div className="text-xs text-muted-foreground mt-1">{subtitle}</div> : null}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-primary/90">
          interactive
        </div>
      </div>
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-xs font-mono">
      <span className="text-muted-foreground">{label}</span>
      <input
        className="w-28 px-2 py-1 rounded-lg border border-white/10 bg-black/30 text-right"
        type="number"
        value={Number.isFinite(value) ? value : 0}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

export function fmt(x: number, digits = 6) {
  if (!Number.isFinite(x)) return "NaN";
  const s = x.toFixed(digits);
  return s.replace(/\.?0+$/, "");
}
