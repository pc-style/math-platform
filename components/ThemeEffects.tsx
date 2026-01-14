
"use client";

import { useThemeLabels } from "@/hooks/useThemeLabels";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { CRTOverlay } from "@/components/ui/CRTOverlay";
import { NeuralCursor } from "@/components/ui/NeuralCursor";

export function ThemeEffects() {
    const { isCyber } = useThemeLabels();

    if (!isCyber) return null;

    return (
        <>
            <MatrixBackground />
            <CRTOverlay />
            <NeuralCursor />
        </>
    );
}
