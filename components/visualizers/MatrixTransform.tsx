"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

type Matrix2 = [[number, number], [number, number]];
type Vec2 = { x: number; y: number };

type PresetKey = "identity" | "rotate30" | "rotate45" | "scale" | "shear" | "reflectX";

type Preset = {
  key: PresetKey;
  title: string;
  matrix: Matrix2;
};

function round(n: number, digits = 3) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function mul(m: Matrix2, v: Vec2): Vec2 {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y,
    y: m[1][0] * v.x + m[1][1] * v.y,
  };
}

function det(m: Matrix2) {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function rotation(thetaRad: number): Matrix2 {
  const c = Math.cos(thetaRad);
  const s = Math.sin(thetaRad);
  return [
    [c, -s],
    [s, c],
  ];
}

const e1: Vec2 = { x: 1, y: 0 };
const e2: Vec2 = { x: 0, y: 1 };

const PRESETS: Preset[] = [
  {
    key: "identity",
    title: "Identity",
    matrix: [
      [1, 0],
      [0, 1],
    ],
  },
  { key: "rotate30", title: "Rotate 30°", matrix: rotation((30 * Math.PI) / 180) },
  { key: "rotate45", title: "Rotate 45°", matrix: rotation((45 * Math.PI) / 180) },
  {
    key: "scale",
    title: "Scale (x2, y0.6)",
    matrix: [
      [2, 0],
      [0, 0.6],
    ],
  },
  {
    key: "shear",
    title: "Shear (x += 0.8y)",
    matrix: [
      [1, 0.8],
      [0, 1],
    ],
  },
  {
    key: "reflectX",
    title: "Reflect X (y → -y)",
    matrix: [
      [1, 0],
      [0, -1],
    ],
  },
];

export type MatrixTransformProps = {
  initialMatrix?: Matrix2;
  initialVector?: Vec2;
  initialPreset?: PresetKey;
  className?: string;
};

export function MatrixTransform({
  initialMatrix,
  initialVector,
  initialPreset = "identity",
  className = "",
}: MatrixTransformProps) {
  const isLowPerformance = usePerformanceMode();

  const [presetKey, setPresetKey] = useState<PresetKey>(initialPreset);
  const preset = useMemo(() => PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0], [presetKey]);

  const [m00, setM00] = useState<number>(initialMatrix?.[0][0] ?? preset.matrix[0][0]);
  const [m01, setM01] = useState<number>(initialMatrix?.[0][1] ?? preset.matrix[0][1]);
  const [m10, setM10] = useState<number>(initialMatrix?.[1][0] ?? preset.matrix[1][0]);
  const [m11, setM11] = useState<number>(initialMatrix?.[1][1] ?? preset.matrix[1][1]);
  const matrix: Matrix2 = useMemo(
    () => [
      [m00, m01],
      [m10, m11],
    ],
    [m00, m01, m10, m11],
  );

  const [v, setV] = useState<Vec2>(initialVector ?? { x: 2, y: 1 });

  useEffect(() => {
    if (!initialMatrix) {
      setM00(preset.matrix[0][0]);
      setM01(preset.matrix[0][1]);
      setM10(preset.matrix[1][0]);
      setM11(preset.matrix[1][1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey]);

  const width = 620;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;
  const scale = 32; // px per unit

  const toSvg = useCallback(
    (p: Vec2) => ({
      x: cx + p.x * scale,
      y: cy - p.y * scale,
    }),
    [cx, cy],
  );

  const fromSvg = useCallback(
    (svgX: number, svgY: number): Vec2 => ({
      x: (svgX - cx) / scale,
      y: (cy - svgY) / scale,
    }),
    [cx, cy],
  );

  const gridExtent = 6;
  const gridStep = isLowPerformance ? 2 : 1;

  const basePoints = useMemo(() => {
    const pts: Vec2[] = [];
    for (let x = -gridExtent; x <= gridExtent; x += gridStep) {
      for (let y = -gridExtent; y <= gridExtent; y += gridStep) {
        pts.push({ x, y });
      }
    }
    return pts;
  }, [gridStep]);

  const transformedPoints = useMemo(
    () => basePoints.map((p) => mul(matrix, p)),
    [basePoints, matrix],
  );

  const Te1 = useMemo(() => mul(matrix, e1), [matrix]);
  const Te2 = useMemo(() => mul(matrix, e2), [matrix]);
  const Tv = useMemo(() => mul(matrix, v), [matrix, v]);
  const determinant = useMemo(() => det(matrix), [matrix]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; pointerId: number | null }>({
    dragging: false,
    pointerId: null,
  });

  const onPointerDownVector = useCallback((e: React.PointerEvent) => {
    dragRef.current.dragging = true;
    dragRef.current.pointerId = e.pointerId;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.dragging) return;
      if (dragRef.current.pointerId !== e.pointerId) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const next = fromSvg((x / rect.width) * width, (y / rect.height) * height);
      setV({ x: round(next.x, 2), y: round(next.y, 2) });
    },
    [fromSvg],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current.dragging = false;
    dragRef.current.pointerId = null;
  }, []);

  return (
    <section
      data-visualizer="matrix-transform"
      className={`glass border border-white/10 rounded-2xl p-6 flex flex-col gap-4 ${className}`}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Matrix Transform
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Drag the vector, tweak the 2×2 matrix, and watch the plane transform.
            </p>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Preset</span>
            <select
              value={presetKey}
              onChange={(e) => setPresetKey(e.target.value as PresetKey)}
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="grid grid-cols-4 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">a</span>
              <input
                type="number"
                step="0.1"
                value={m00}
                onChange={(e) => setM00(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">b</span>
              <input
                type="number"
                step="0.1"
                value={m01}
                onChange={(e) => setM01(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">c</span>
              <input
                type="number"
                step="0.1"
                value={m10}
                onChange={(e) => setM10(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">d</span>
              <input
                type="number"
                step="0.1"
                value={m11}
                onChange={(e) => setM11(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Vector x</span>
              <input
                type="number"
                step="0.1"
                value={v.x}
                onChange={(e) => setV((prev) => ({ ...prev, x: Number(e.target.value) }))}
                className="w-28 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--muted)]">Vector y</span>
              <input
                type="number"
                step="0.1"
                value={v.y}
                onChange={(e) => setV((prev) => ({ ...prev, y: Number(e.target.value) }))}
                className="w-28 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
              />
            </label>
            <button
              type="button"
              onClick={() => setV({ x: 2, y: 1 })}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--primary)]/50"
            >
              Reset vector
            </button>
          </div>

          <div className="ml-auto text-sm text-[var(--muted)] flex items-center gap-3">
            <span>
              det(A) = <span className="text-[var(--text)]">{round(determinant, 3)}</span>
            </span>
            <span className="hidden sm:inline text-[var(--muted)]">|</span>
            <span className="text-[var(--muted)]">
              A·v ={" "}
              <span className="text-[var(--text)]">
                ({round(Tv.x, 2)}, {round(Tv.y, 2)})
              </span>
            </span>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40">
        <svg
          ref={svgRef}
          width="100%"
          height="360"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="2D linear transformation visualization"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          {Array.from({ length: gridExtent * 2 + 1 }, (_, i) => i - gridExtent).map((k) => {
            if (gridStep > 1 && k % gridStep !== 0) return null;
            const x = cx + k * scale;
            const y = cy - k * scale;
            const isAxis = k === 0;
            return (
              <g key={k}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={height}
                  stroke={isAxis ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}
                  strokeWidth={isAxis ? 2 : 1}
                />
                <line
                  x1={0}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke={isAxis ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)"}
                  strokeWidth={isAxis ? 2 : 1}
                />
              </g>
            );
          })}

          {/* Original points */}
          {basePoints.map((p, i) => {
            const s = toSvg(p);
            return (
              <circle key={`b-${i}`} cx={s.x} cy={s.y} r={1.5} fill="rgba(255,255,255,0.28)" />
            );
          })}

          {/* Transformed points */}
          {transformedPoints.map((p, i) => {
            const s = toSvg(p);
            return <circle key={`t-${i}`} cx={s.x} cy={s.y} r={1.8} fill="rgba(255,0,255,0.65)" />;
          })}

          {/* Basis vectors and their images */}
          {(() => {
            const o = toSvg({ x: 0, y: 0 });
            const e1s = toSvg(e1);
            const e2s = toSvg(e2);
            const Te1s = toSvg(Te1);
            const Te2s = toSvg(Te2);
            return (
              <>
                <line
                  x1={o.x}
                  y1={o.y}
                  x2={e1s.x}
                  y2={e1s.y}
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={2}
                />
                <line
                  x1={o.x}
                  y1={o.y}
                  x2={e2s.x}
                  y2={e2s.y}
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth={2}
                />

                <line
                  x1={o.x}
                  y1={o.y}
                  x2={Te1s.x}
                  y2={Te1s.y}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  filter="url(#glow)"
                />
                <line
                  x1={o.x}
                  y1={o.y}
                  x2={Te2s.x}
                  y2={Te2s.y}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  filter="url(#glow)"
                />

                <circle cx={Te1s.x} cy={Te1s.y} r={4} fill="var(--primary)" filter="url(#glow)" />
                <circle cx={Te2s.x} cy={Te2s.y} r={4} fill="var(--primary)" filter="url(#glow)" />
              </>
            );
          })()}

          {/* Vector v and A v */}
          {(() => {
            const o = toSvg({ x: 0, y: 0 });
            const vs = toSvg(v);
            const Tvs = toSvg(Tv);
            return (
              <>
                <line
                  x1={o.x}
                  y1={o.y}
                  x2={vs.x}
                  y2={vs.y}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={3}
                />
                <circle
                  cx={vs.x}
                  cy={vs.y}
                  r={7}
                  fill="rgba(255,255,255,0.2)"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  onPointerDown={onPointerDownVector}
                  style={{ cursor: "grab" }}
                />

                <line
                  x1={o.x}
                  y1={o.y}
                  x2={Tvs.x}
                  y2={Tvs.y}
                  stroke="var(--primary)"
                  strokeWidth={4}
                />
                <circle cx={Tvs.x} cy={Tvs.y} r={6} fill="var(--primary)" filter="url(#glow)" />
              </>
            );
          })()}
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="glass border border-white/10 rounded-xl p-4">
          <div className="text-[var(--muted)] mb-1">Matrix</div>
          <div className="font-mono text-[var(--text)]">
            [{round(m00, 3)} {round(m01, 3)}]
            <br />[{round(m10, 3)} {round(m11, 3)}]
          </div>
        </div>
        <div className="glass border border-white/10 rounded-xl p-4">
          <div className="text-[var(--muted)] mb-1">e₁ → A e₁</div>
          <div className="font-mono text-[var(--text)]">
            ({round(Te1.x, 3)}, {round(Te1.y, 3)})
          </div>
        </div>
        <div className="glass border border-white/10 rounded-xl p-4">
          <div className="text-[var(--muted)] mb-1">e₂ → A e₂</div>
          <div className="font-mono text-[var(--text)]">
            ({round(Te2.x, 3)}, {round(Te2.y, 3)})
          </div>
        </div>
      </div>
    </section>
  );
}

export function matrixTransformConfigFromUnknown(input: unknown): Partial<MatrixTransformProps> {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;

  const initialPreset = record.initialPreset;
  const presetOk =
    initialPreset === "identity" ||
    initialPreset === "rotate30" ||
    initialPreset === "rotate45" ||
    initialPreset === "scale" ||
    initialPreset === "shear" ||
    initialPreset === "reflectX";

  const matrix = record.initialMatrix;
  const vector = record.initialVector;

  const initialMatrix =
    Array.isArray(matrix) &&
    matrix.length === 2 &&
    Array.isArray(matrix[0]) &&
    Array.isArray(matrix[1]) &&
    matrix[0].length === 2 &&
    matrix[1].length === 2 &&
    typeof matrix[0][0] === "number" &&
    typeof matrix[0][1] === "number" &&
    typeof matrix[1][0] === "number" &&
    typeof matrix[1][1] === "number"
      ? (matrix as Matrix2)
      : undefined;

  const initialVector =
    vector &&
    typeof vector === "object" &&
    typeof (vector as Record<string, unknown>).x === "number" &&
    typeof (vector as Record<string, unknown>).y === "number"
      ? ({
          x: (vector as Record<string, number>).x,
          y: (vector as Record<string, number>).y,
        } as Vec2)
      : undefined;

  return {
    ...(presetOk ? { initialPreset: initialPreset as PresetKey } : {}),
    ...(initialMatrix ? { initialMatrix } : {}),
    ...(initialVector ? { initialVector } : {}),
  };
}
