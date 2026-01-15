"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

interface ValidationFeedbackProps {
  status: "idle" | "success" | "failure";
  message?: string;
  onAnimationComplete?: () => void;
}

export const ValidationFeedback: React.FC<ValidationFeedbackProps> = ({
  status,
  message,
  onAnimationComplete,
}) => {
  const isLowPerformance = usePerformanceMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [particles, setParticles] = useState<
    {
      id: string;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
      rotate: number;
      color: string;
    }[]
  >([]);

  useEffect(() => {
    if (status === "idle" || isLowPerformance) {
      const timer = setTimeout(() => setParticles([]), 0);
      return () => clearTimeout(timer);
    }

    const count = status === "success" ? 18 : 12;
    const palette =
      status === "success"
        ? ["#ff00ff", "#00ffff", "#ffffff", "#ff7bff"]
        : ["#ff3b3b", "#ff8a00", "#ffffff", "#ff00ff"];

    const nextParticles = Array.from({ length: count }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = (status === "success" ? 34 : 28) + Math.random() * 38;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.8;
      const size = status === "success" ? 3 + Math.random() * 4 : 2 + Math.random() * 3;
      const delay = Math.random() * 0.08;
      const duration = 0.55 + Math.random() * 0.35;
      const rotate = (Math.random() - 0.5) * 220;
      const color = palette[idx % palette.length]!;
      return { id: `${burstKey}-${idx}`, x, y, size, delay, duration, rotate, color };
    });

    const timer = setTimeout(() => setParticles(nextParticles), 0);
    return () => clearTimeout(timer);
  }, [burstKey, isLowPerformance, status]);

  useEffect(() => {
    if (!canvasRef.current || isLowPerformance) return;

    confettiInstanceRef.current = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    return () => {
      confettiInstanceRef.current?.reset();
      confettiInstanceRef.current = null;
    };
  }, [isLowPerformance]);

  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setBurstKey((k) => k + 1), 0);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "success" || isLowPerformance) return;

    confettiInstanceRef.current?.({
      particleCount: 140,
      spread: 75,
      startVelocity: 45,
      origin: { y: 0.7 },
      colors: ["#ff00ff", "#00ffff", "#f5f5f5"],
    });
    confettiInstanceRef.current?.({
      particleCount: 60,
      spread: 120,
      startVelocity: 28,
      decay: 0.9,
      origin: { y: 0.55 },
      colors: ["#ff00ff", "#ff7bff", "#00ffff"],
    });
    setTimeout(() => {
      confettiInstanceRef.current?.({
        particleCount: 40,
        spread: 40,
        startVelocity: 55,
        ticks: 120,
        origin: { y: 0.62 },
        colors: ["#ff00ff", "#00ffff", "#ffffff"],
      });
    }, 160);
  }, [status, isLowPerformance]);

  useEffect(() => {
    if (status !== "failure" || isLowPerformance) return;
    confettiInstanceRef.current?.({
      particleCount: 55,
      spread: 55,
      startVelocity: 34,
      decay: 0.88,
      gravity: 1.15,
      origin: { y: 0.72 },
      colors: ["#ff3b3b", "#ff8a00", "#ffffff", "#ff00ff"],
    });
  }, [status, isLowPerformance]);

  const wrapperMotion =
    status === "success"
      ? {
          initial: { opacity: 0, scale: 0.92, y: 24, rotate: -1.5 },
          animate: {
            opacity: 1,
            scale: [0.92, 1.05, 1],
            y: [24, -2, 0],
            rotate: [-1.5, 0.8, 0],
          },
          transition: { type: "spring" as const, stiffness: 520, damping: 24, mass: 0.7 },
        }
      : {
          initial: { opacity: 0, scale: 0.96, y: 24 },
          animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            x: [0, -10, 10, -9, 9, -6, 6, 0],
          },
          transition: { duration: 0.55, ease: "easeOut" as const },
        };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40"
        aria-hidden="true"
      />
      <AnimatePresence onExitComplete={onAnimationComplete}>
        {status !== "idle" && (
          <motion.div
            initial={wrapperMotion.initial}
            animate={wrapperMotion.animate}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={wrapperMotion.transition}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border overflow-hidden ${
              status === "success"
                ? "bg-green-500/20 border-green-500/50 text-green-200"
                : "bg-red-500/20 border-red-500/50 text-red-200"
            }`}
          >
            <motion.div
              aria-hidden="true"
              className="absolute -inset-10 opacity-70"
              animate={{
                opacity: status === "success" ? [0.25, 0.6, 0.35] : [0.22, 0.5, 0.28],
                backgroundPositionX: ["0%", "100%"],
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage:
                  status === "success"
                    ? "linear-gradient(90deg, rgba(0,255,255,0), rgba(0,255,255,0.18), rgba(255,0,255,0.22), rgba(0,255,255,0))"
                    : "linear-gradient(90deg, rgba(255,0,255,0), rgba(255,0,255,0.16), rgba(255,60,60,0.20), rgba(255,0,255,0))",
                backgroundSize: "180% 100%",
              }}
            />

            <div className="relative">
              <motion.div
                aria-hidden="true"
                className="absolute -inset-3 rounded-full blur-xl"
                animate={
                  status === "success"
                    ? { opacity: [0.25, 0.75, 0.35], scale: [0.95, 1.18, 1.02] }
                    : { opacity: [0.2, 0.55, 0.28], scale: [0.95, 1.1, 1.0] }
                }
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    status === "success"
                      ? "radial-gradient(circle at 40% 50%, rgba(255,0,255,0.35), rgba(0,255,255,0.20), rgba(0,0,0,0))"
                      : "radial-gradient(circle at 40% 50%, rgba(255,60,60,0.30), rgba(255,0,255,0.16), rgba(0,0,0,0))",
                }}
              />
              <motion.div
                initial={false}
                animate={
                  status === "success"
                    ? { scale: [1, 1.2, 1], rotate: [-6, 6, 0] }
                    : { scale: [1, 1.05, 1] }
                }
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="relative"
              >
                {status === "success" ? (
                  <CheckCircle2 className="w-6 h-6 text-green-300 drop-shadow-[0_0_16px_rgba(0,255,160,0.35)]" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-300 drop-shadow-[0_0_16px_rgba(255,60,60,0.35)]" />
                )}
              </motion.div>
            </div>

            <div className="flex flex-col">
              <span className="font-bold tracking-tight">
                {status === "success" ? "Challenge Passed!" : "Not Quite Yet"}
              </span>
              {message && <span className="text-sm opacity-80">{message}</span>}
            </div>

            {!isLowPerformance ? (
              <div className="pointer-events-none absolute inset-0">
                {particles.map((p) => (
                  <motion.span
                    key={p.id}
                    className="absolute left-1/2 top-1/2 rounded-full"
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 0,
                      scale: 0.6,
                      rotate: 0,
                    }}
                    animate={{
                      x: p.x,
                      y: p.y,
                      opacity: [0, 1, 0],
                      scale: [0.6, 1, 0.9],
                      rotate: p.rotate,
                    }}
                    transition={{
                      delay: p.delay,
                      duration: p.duration,
                      ease: "easeOut",
                    }}
                    style={{
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      boxShadow: `0 0 18px ${p.color}`,
                    }}
                  />
                ))}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
