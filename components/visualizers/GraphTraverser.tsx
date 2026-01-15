"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

type NodeId = string;
type Graph = Record<NodeId, NodeId[]>;

type Algorithm = "bfs" | "dfs";

type GraphPresetKey = "tree" | "cycle" | "dag";

type GraphPreset = {
  key: GraphPresetKey;
  title: string;
  description: string;
  graph: Graph;
};

const PRESETS: GraphPreset[] = [
  {
    key: "tree",
    title: "Tree",
    description: "A small tree graph (no cycles).",
    graph: {
      A: ["B", "C"],
      B: ["D", "E"],
      C: ["F"],
      D: [],
      E: [],
      F: [],
    },
  },
  {
    key: "cycle",
    title: "Cycle",
    description: "A cyclic graph (tests visited-set logic).",
    graph: {
      A: ["B", "C"],
      B: ["D"],
      C: ["B", "E"],
      D: ["A", "F"],
      E: ["F"],
      F: ["C"],
    },
  },
  {
    key: "dag",
    title: "DAG",
    description: "A directed acyclic graph with converging edges.",
    graph: {
      A: ["B", "C"],
      B: ["D", "E"],
      C: ["E"],
      D: ["F"],
      E: ["F"],
      F: [],
    },
  },
];

function uniq<T>(items: T[]) {
  return Array.from(new Set(items));
}

function computeCircularLayout(nodeIds: NodeId[], width: number, height: number) {
  const ids = [...nodeIds].sort();
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.35;
  const positions = new Map<NodeId, { x: number; y: number }>();
  ids.forEach((id, index) => {
    const t = (index / Math.max(1, ids.length)) * Math.PI * 2 - Math.PI / 2;
    positions.set(id, { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  });
  return positions;
}

function parseAlgorithm(value: unknown): Algorithm | null {
  if (value === "bfs" || value === "dfs") return value;
  return null;
}

export type GraphTraverserProps = {
  initialAlgorithm?: Algorithm;
  initialPreset?: GraphPresetKey;
  initialStartNode?: NodeId;
  className?: string;
};

export function GraphTraverser({
  initialAlgorithm = "bfs",
  initialPreset = "tree",
  initialStartNode,
  className = "",
}: GraphTraverserProps) {
  const isLowPerformance = usePerformanceMode();

  const [presetKey, setPresetKey] = useState<GraphPresetKey>(initialPreset);
  const preset = useMemo(() => PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0], [presetKey]);

  const nodeIds = useMemo(() => {
    const fromKeys = Object.keys(preset.graph);
    const fromValues = Object.values(preset.graph).flat();
    return uniq([...fromKeys, ...fromValues]).sort();
  }, [preset.graph]);

  const [algorithm, setAlgorithm] = useState<Algorithm>(initialAlgorithm);
  const [startNode, setStartNode] = useState<NodeId>(() => initialStartNode ?? nodeIds[0] ?? "A");
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "done">("idle");
  const [frontier, setFrontier] = useState<NodeId[]>(() => [startNode]);
  const [visited, setVisited] = useState<Set<NodeId>>(() => new Set());
  const [current, setCurrent] = useState<NodeId | null>(null);
  const [order, setOrder] = useState<NodeId[]>([]);
  const [speedMs, setSpeedMs] = useState<number>(isLowPerformance ? 650 : 350);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Keep start node valid when preset changes.
    if (!nodeIds.includes(startNode)) {
      setStartNode(nodeIds[0] ?? "A");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey]);

  const reset = useCallback(
    (next?: { preset?: GraphPresetKey; algorithm?: Algorithm; startNode?: NodeId }) => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const nextPresetKey = next?.preset ?? presetKey;
      const nextAlgorithm = next?.algorithm ?? algorithm;
      const nextPreset = PRESETS.find((p) => p.key === nextPresetKey) ?? PRESETS[0];

      const nextNodeIds = uniq([
        ...Object.keys(nextPreset.graph),
        ...Object.values(nextPreset.graph).flat(),
      ]).sort();
      const nextStartNode = next?.startNode ?? startNode ?? nextNodeIds[0] ?? "A";

      setPresetKey(nextPresetKey);
      setAlgorithm(nextAlgorithm);
      setStartNode(nextStartNode);
      setStatus("idle");
      setVisited(new Set());
      setFrontier([nextStartNode]);
      setCurrent(null);
      setOrder([]);
    },
    [algorithm, presetKey, startNode],
  );

  const stepOnce = useCallback(() => {
    setFrontier((prevFrontier) => {
      let nextFrontier = [...prevFrontier];
      let next: NodeId | undefined;

      while (nextFrontier.length > 0) {
        next = algorithm === "bfs" ? nextFrontier.shift() : nextFrontier.pop();
        if (!next) break;
        if (!visited.has(next)) break;
        next = undefined;
      }

      if (!next) {
        setCurrent(null);
        setStatus("done");
        return nextFrontier;
      }

      setCurrent(next);
      setVisited((prevVisited) => {
        const v = new Set(prevVisited);
        v.add(next!);
        return v;
      });
      setOrder((prevOrder) => [...prevOrder, next!]);

      const neighbors = preset.graph[next] ?? [];
      const addable = neighbors.filter((id) => !visited.has(id) && !nextFrontier.includes(id));
      const toAdd = algorithm === "dfs" ? [...addable].reverse() : addable;
      nextFrontier = [...nextFrontier, ...toAdd];

      if (nextFrontier.length === 0) {
        setStatus("done");
      } else if (status === "idle") {
        setStatus("paused");
      }

      return nextFrontier;
    });
  }, [algorithm, preset.graph, status, visited]);

  const run = useCallback(() => {
    if (status === "done") return;
    setStatus("running");
  }, [status]);

  const pause = useCallback(() => {
    setStatus((s) => (s === "running" ? "paused" : s));
  }, []);

  useEffect(() => {
    if (status !== "running") {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = window.setInterval(() => {
      stepOnce();
    }, speedMs);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [speedMs, status, stepOnce]);

  const width = 620;
  const height = 320;
  const positions = useMemo(() => computeCircularLayout(nodeIds, width, height), [nodeIds]);

  const edges = useMemo(() => {
    const unique: Array<{ from: NodeId; to: NodeId }> = [];
    const seen = new Set<string>();
    for (const [from, tos] of Object.entries(preset.graph)) {
      for (const to of tos) {
        const key = `${from}->${to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push({ from, to });
      }
    }
    return unique;
  }, [preset.graph]);

  const frontierLabel = algorithm === "bfs" ? "Queue" : "Stack";

  return (
    <section
      data-visualizer="graph-traverser"
      className={`glass border border-white/10 rounded-2xl p-6 flex flex-col gap-4 ${className}`}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
              Graph Traverser
            </h3>
            <p className="text-sm text-[var(--muted)]">{preset.description}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => reset({ algorithm: "bfs" })}
              className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                algorithm === "bfs"
                  ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                  : "bg-transparent text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]/50"
              }`}
            >
              BFS
            </button>
            <button
              type="button"
              onClick={() => reset({ algorithm: "dfs" })}
              className={`px-3 py-1.5 rounded-lg border text-sm transition ${
                algorithm === "dfs"
                  ? "bg-[var(--primary)] text-black border-[var(--primary)]"
                  : "bg-transparent text-[var(--text)] border-[var(--border)] hover:border-[var(--primary)]/50"
              }`}
            >
              DFS
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Preset</span>
            <select
              value={presetKey}
              onChange={(e) => reset({ preset: e.target.value as GraphPresetKey })}
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[var(--muted)]">Start node</span>
            <select
              value={startNode}
              onChange={(e) => reset({ startNode: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)]"
            >
              {nodeIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm min-w-[220px]">
            <span className="text-[var(--muted)]">Speed</span>
            <input
              type="range"
              min={150}
              max={1200}
              step={25}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="accent-[var(--primary)]"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={run}
              disabled={status === "running" || status === "done"}
              className="px-4 py-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] text-black disabled:opacity-40"
            >
              Run
            </button>
            <button
              type="button"
              onClick={pause}
              disabled={status !== "running"}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--primary)]/50 disabled:opacity-40"
            >
              Pause
            </button>
            <button
              type="button"
              onClick={stepOnce}
              disabled={status === "running" || status === "done"}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--primary)]/50 disabled:opacity-40"
            >
              Step
            </button>
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text)] hover:border-[var(--primary)]/50"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40">
          <svg
            width="100%"
            height="320"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Graph visualization"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((e) => {
              const p1 = positions.get(e.from);
              const p2 = positions.get(e.to);
              if (!p1 || !p2) return null;
              const isActive = current === e.from && frontier.includes(e.to);
              return (
                <line
                  key={`${e.from}->${e.to}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={isActive ? "var(--primary)" : "rgba(255,255,255,0.18)"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  filter={isActive ? "url(#glow)" : undefined}
                />
              );
            })}

            {/* Nodes */}
            {nodeIds.map((id) => {
              const p = positions.get(id);
              if (!p) return null;
              const isVisited = visited.has(id);
              const isCurrent = current === id;
              const isInFrontier = frontier.includes(id);

              const fill = isCurrent
                ? "rgba(255,0,255,0.25)"
                : isVisited
                  ? "rgba(255,0,255,0.15)"
                  : isInFrontier
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.25)";

              const stroke = isCurrent || isVisited ? "var(--primary)" : "rgba(255,255,255,0.28)";

              return (
                <g
                  key={id}
                  role="button"
                  tabIndex={0}
                  onClick={() => reset({ startNode: id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") reset({ startNode: id });
                  }}
                  aria-label={`Node ${id}`}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={22}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isCurrent ? 3 : 2}
                    filter={isCurrent ? "url(#glow)" : undefined}
                  />
                  <text
                    x={p.x}
                    y={p.y + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fill={isCurrent ? "var(--primary)" : "rgba(255,255,255,0.9)"}
                    style={{ fontFamily: "var(--font-family)" }}
                  >
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="flex flex-col gap-3">
          <div className="glass border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">Status</span>
              <span className="text-sm text-[var(--text)]">
                {status === "idle"
                  ? "Idle"
                  : status === "running"
                    ? "Running"
                    : status === "paused"
                      ? "Paused"
                      : "Done"}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted)]">Current</span>
                <span className="text-[var(--text)]">{current ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[var(--muted)]">Visited</span>
                <span className="text-[var(--text)]">{visited.size}</span>
              </div>
            </div>
          </div>

          <div className="glass border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted)]">{frontierLabel}</span>
              <span className="text-xs text-[var(--muted)]">
                {algorithm === "bfs" ? "Front → back" : "Bottom → top"}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {frontier.length === 0 ? (
                <span className="text-sm text-[var(--muted)]">Empty</span>
              ) : (
                frontier.map((id, index) => (
                  <span
                    key={`${id}-${index}`}
                    className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-black/30 text-[var(--text)]"
                  >
                    {id}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="glass border border-white/10 rounded-xl p-4">
            <span className="text-sm text-[var(--muted)]">Traversal order</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {order.length === 0 ? (
                <span className="text-sm text-[var(--muted)]">—</span>
              ) : (
                order.map((id, index) => (
                  <span
                    key={`${id}-order-${index}`}
                    className="text-xs px-2 py-1 rounded-lg border border-[var(--primary)]/40 bg-[var(--primary)]/10 text-[var(--text)]"
                  >
                    {id}
                  </span>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function graphTraverserConfigFromUnknown(input: unknown): Partial<GraphTraverserProps> {
  if (!input || typeof input !== "object") return {};
  const record = input as Record<string, unknown>;

  const algorithm = parseAlgorithm(record.initialAlgorithm);
  const preset = record.initialPreset;

  return {
    ...(algorithm ? { initialAlgorithm: algorithm } : {}),
    ...(preset === "tree" || preset === "cycle" || preset === "dag"
      ? { initialPreset: preset }
      : {}),
    ...(typeof record.initialStartNode === "string"
      ? { initialStartNode: record.initialStartNode }
      : {}),
  };
}
