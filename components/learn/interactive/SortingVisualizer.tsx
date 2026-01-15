"use client";

import React, { useEffect, useMemo, useReducer, useState } from "react";

const DEFAULT_SIZE = 24;
const MIN_VALUE = 8;
const MAX_VALUE = 100;

const buildValues = (size: number) =>
  Array.from(
    { length: size },
    () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE,
  );

type SortState = {
  values: number[];
  pass: number;
  index: number;
  comparisons: number;
  swaps: number;
  passSwapped: boolean;
  isSorted: boolean;
};

type SortAction = { type: "reset"; size: number } | { type: "shuffle" } | { type: "step" };

const buildState = (size: number): SortState => ({
  values: buildValues(size),
  pass: 0,
  index: 0,
  comparisons: 0,
  swaps: 0,
  passSwapped: false,
  isSorted: false,
});

const sortReducer = (state: SortState, action: SortAction): SortState => {
  switch (action.type) {
    case "reset":
      return buildState(action.size);
    case "shuffle":
      return {
        ...buildState(state.values.length),
      };
    case "step": {
      if (state.isSorted) return state;

      const length = state.values.length;
      if (state.pass >= length - 1) {
        return { ...state, isSorted: true };
      }

      if (state.index >= length - state.pass - 1) {
        if (!state.passSwapped) {
          return { ...state, isSorted: true };
        }

        return {
          ...state,
          pass: state.pass + 1,
          index: 0,
          passSwapped: false,
        };
      }

      const nextValues = [...state.values];
      const left = nextValues[state.index];
      const right = nextValues[state.index + 1];
      const shouldSwap = left > right;
      let swaps = state.swaps;

      if (shouldSwap) {
        nextValues[state.index] = right;
        nextValues[state.index + 1] = left;
        swaps += 1;
      }

      return {
        ...state,
        values: nextValues,
        index: state.index + 1,
        comparisons: state.comparisons + 1,
        swaps,
        passSwapped: state.passSwapped || shouldSwap,
      };
    }
    default:
      return state;
  }
};

export const SortingVisualizer: React.FC = () => {
  const [state, dispatch] = useReducer(sortReducer, DEFAULT_SIZE, buildState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(280);

  const maxValue = useMemo(() => Math.max(...state.values, MAX_VALUE), [state.values]);

  useEffect(() => {
    if (!isPlaying || state.isSorted) return;

    const timer = window.setInterval(() => {
      dispatch({ type: "step" });
    }, speed);

    return () => window.clearInterval(timer);
  }, [isPlaying, speed, state.isSorted]);

  useEffect(() => {
    if (state.isSorted && isPlaying) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
    }
  }, [state.isSorted, isPlaying]);

  const sortedStartIndex = state.values.length - state.pass;
  const activeIndex = state.index;

  return (
    <section className="flex flex-col gap-6 h-full p-6 glass border border-white/10 rounded-2xl overflow-hidden">
      <header className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-[0.3em] text-primary/80 font-bold">
          Interactive Lab
        </span>
        <h2 className="text-2xl font-bold text-foreground">Bubble Sort Visualizer</h2>
        <p className="text-sm text-muted-foreground max-w-xl">
          Step through bubble sort comparisons. Each tick compares two neighbors and swaps if they
          are out of order.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              dispatch({ type: "shuffle" });
              setIsPlaying(false);
            }}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-primary/60 hover:bg-primary/5 transition-all text-xs uppercase tracking-widest"
          >
            Shuffle
          </button>
          <button
            onClick={() => {
              dispatch({ type: "step" });
              setIsPlaying(false);
            }}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-primary/60 hover:bg-primary/5 transition-all text-xs uppercase tracking-widest"
            disabled={state.isSorted}
          >
            Step
          </button>
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-xs uppercase tracking-widest hover:bg-primary/30 transition-all"
            disabled={state.isSorted}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => {
              dispatch({ type: "reset", size: DEFAULT_SIZE });
              setIsPlaying(false);
            }}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-primary/60 hover:bg-primary/5 transition-all text-xs uppercase tracking-widest"
          >
            Reset
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Speed
            </span>
            <input
              type="range"
              min={120}
              max={900}
              step={20}
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="accent-primary w-36"
            />
            <span className="text-xs font-mono text-muted-foreground">{speed}ms</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl border border-white/10 bg-white/5">
            Pass <span className="text-primary">{state.pass + 1}</span>
          </div>
          <div className="p-3 rounded-xl border border-white/10 bg-white/5">
            Comparisons <span className="text-primary">{state.comparisons}</span>
          </div>
          <div className="p-3 rounded-xl border border-white/10 bg-white/5">
            Swaps <span className="text-primary">{state.swaps}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 p-6 flex items-end gap-2">
        {state.values.map((value, idx) => {
          const isActive = idx === activeIndex || idx === activeIndex + 1;
          const isSorted = idx >= sortedStartIndex;
          const height = Math.round((value / maxValue) * 220) + 24;

          return (
            <div
              key={`${value}-${idx}`}
              className={`flex-1 rounded-lg transition-all duration-200 ${
                isSorted
                  ? "bg-primary/40 border border-primary/60"
                  : isActive
                    ? "bg-primary/70 border border-primary"
                    : "bg-white/10 border border-white/10"
              }`}
              style={{ height }}
              aria-label={`Value ${value}`}
            />
          );
        })}
      </div>

      <footer className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {!state.isSorted ? (
          <>
            <span>
              Comparing index {activeIndex + 1} and {activeIndex + 2}
            </span>
            <span>Sorted tail starts at {sortedStartIndex + 1}</span>
          </>
        ) : null}
        {state.isSorted ? <span className="text-primary">Array sorted.</span> : null}
      </footer>
    </section>
  );
};

export default SortingVisualizer;
