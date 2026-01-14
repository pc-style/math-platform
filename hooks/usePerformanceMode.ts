"use client";

import { useState, useEffect } from 'react';

export const usePerformanceMode = () => {
    const [isLowPerformance, setIsLowPerformance] = useState(false);

    useEffect(() => {
        const checkPerformance = () => {
            // Check for user preference first
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                return true;
            }

            // Check hardware concurrency (logical processors)
            // Low-end usually has 4 or fewer threads
            if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
                return true;
            }

            // Check device memory (if available, mostly Chrome/Edge)
            // @ts-ignore - deviceMemory is not in standard TS types yet
            if (navigator.deviceMemory && navigator.deviceMemory <= 4) {
                return true;
            }

            return false;
        };

        setIsLowPerformance(checkPerformance());
    }, []);

    return isLowPerformance;
};
