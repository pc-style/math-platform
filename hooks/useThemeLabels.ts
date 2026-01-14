
"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export type ThemeType = "minimalistic-light" | "minimalistic-dark" | "minimalistic-warm" | "cybernetic-dark";

export function useThemeLabels() {
    const settings = useQuery(api.users.getSettings);
    const currentTheme = settings?.theme || "minimalistic-light";
    const isCyber = currentTheme === "cybernetic-dark";

    const getLabel = (key: keyof typeof labels) => {
        return isCyber ? labels[key].cyber : labels[key].normal;
    };

    return { getLabel, isCyber, currentTheme };
}

const labels = {
    dashboard: {
        normal: "Dashboard",
        cyber: "<DASHBOARD_STATION />"
    },
    newPlan: {
        normal: "Nowy Plan",
        cyber: "<NOWY_PLAN />"
    },
    settings: {
        normal: "Ustawienia",
        cyber: "<USTAWIENIA />"
    },
    projects: {
        normal: "Moje Projekty",
        cyber: "<MOJE_PROJEKTY />"
    },
    logout: {
        normal: "Wyloguj",
        cyber: "[ LOGOUT ]"
    },
    login: {
        normal: "Zaloguj",
        cyber: "Inicjuj"
    },
    register: {
        normal: "Rejestracja",
        cyber: "Rejestracja"
    },
    generating: {
        normal: "Generowanie planu...",
        cyber: "SYSTEM_GENERATING..."
    },
    uploading: {
        normal: "Przesyłanie...",
        cyber: "UPLOADING_DATA..."
    },
    theory: {
        normal: "Teoria",
        cyber: "Faza I: Teoria"
    },
    practice: {
        normal: "Ćwiczenia",
        cyber: "Faza II: Ćwiczenia"
    },
    exam: {
        normal: "Egzamin",
        cyber: "Faza III: Egzamin"
    }
};
