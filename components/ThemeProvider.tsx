"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Skip if not authenticated or loading, default to cybernetic-dark
    const settings = useQuery(api.users.getSettings);

    useEffect(() => {
        if (settings?.theme) {
            document.documentElement.setAttribute("data-theme", settings.theme);
        } else {
            // Default fallback
            document.documentElement.setAttribute("data-theme", "minimalistic-light");
        }
    }, [settings]);

    return <>{children}</>;
}
