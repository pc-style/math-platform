"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useQuery(api.users.getSettings);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyTheme = () => {
      if (settings?.prefersSystemTheme) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute(
          "data-theme",
          prefersDark ? "minimalistic-dark" : "minimalistic-light",
        );
        return;
      }

      if (settings?.theme) {
        document.documentElement.setAttribute("data-theme", settings.theme);
        return;
      }

      document.documentElement.setAttribute("data-theme", "minimalistic-warm");
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      if (!settings?.prefersSystemTheme) return;
      document.documentElement.setAttribute(
        "data-theme",
        event.matches ? "minimalistic-dark" : "minimalistic-light",
      );
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [settings?.theme, settings?.prefersSystemTheme]);

  return <>{children}</>;
}
