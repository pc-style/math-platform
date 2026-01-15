"use client";

import React, { useEffect, useRef } from "react";
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
  }, [status, isLowPerformance]);

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              status === "success"
                ? "bg-green-500/20 border-green-500/50 text-green-200"
                : "bg-red-500/20 border-red-500/50 text-red-200"
            }`}
            variants={status === "failure" ? shakeVariants : {}}
          >
            {status === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-400" />
            )}
            <div className="flex flex-col">
              <span className="font-bold tracking-tight">
                {status === "success" ? "Challenge Passed!" : "Not Quite Yet"}
              </span>
              {message && <span className="text-sm opacity-80">{message}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
