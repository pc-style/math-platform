"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

type SoundManager = {
  playSuccess: () => void;
  playFailure: () => void;
  playLevelUp: () => void;
};

const getAudioContext = () => {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AudioContextClass();
};

export const useSoundManager = (): SoundManager => {
  const isLowPerformance = usePerformanceMode();
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(async () => {
    if (isLowPerformance) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = getAudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, [isLowPerformance]);

  const playTone = useCallback(
    async (frequency: number, duration: number, type: OscillatorType, volume: number) => {
      const context = await getContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      const now = context.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + duration + 0.02);
    },
    [getContext],
  );

  const playSuccess = useCallback(() => {
    void playTone(523.25, 0.16, "sine", 0.08);
    setTimeout(() => {
      void playTone(659.25, 0.18, "sine", 0.09);
    }, 120);
    setTimeout(() => {
      void playTone(783.99, 0.2, "sine", 0.1);
    }, 240);
  }, [playTone]);

  const playFailure = useCallback(() => {
    void playTone(220, 0.22, "triangle", 0.08);
    setTimeout(() => {
      void playTone(174.61, 0.18, "triangle", 0.07);
    }, 160);
  }, [playTone]);

  const playLevelUp = useCallback(() => {
    void playTone(392, 0.12, "sine", 0.06);
    setTimeout(() => {
      void playTone(523.25, 0.12, "sine", 0.07);
    }, 110);
    setTimeout(() => {
      void playTone(659.25, 0.14, "sine", 0.08);
    }, 220);
    setTimeout(() => {
      void playTone(783.99, 0.18, "sine", 0.09);
    }, 340);
  }, [playTone]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  return { playSuccess, playFailure, playLevelUp };
};
