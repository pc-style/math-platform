"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Simple global logger for dev mode
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as unknown as { __APP_LOGS: { time: string; msg: string }[] }).__APP_LOGS = [];
  const originalConsoleLog = console.log;
  console.log = (...args: unknown[]) => {
    (window as unknown as { __APP_LOGS: { time: string; msg: string }[] }).__APP_LOGS.push({
      time: new Date().toLocaleTimeString(),
      msg: args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
    });
    originalConsoleLog(...args);
  };
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
