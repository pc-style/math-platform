
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Palette, Check, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";

const themes = [
    { id: "minimalistic-light", name: "Modern White", description: "Jasny, profesjonalny i czytelny", color: "#ffffff" },
    { id: "minimalistic-dark", name: "Pure Dark", description: "Elegancki ciemny motyw", color: "#0a0a0a" },
    { id: "minimalistic-warm", name: "Paper Warm", description: "Ciepły, łagodny dla oczu", color: "#fbfaf5" },
    { id: "cybernetic-dark", name: "Cyber Pink", description: "Ekspresyjny styl deweloperski", color: "#ff00ff" },
];

export default function SettingsPage() {
    const userSettings = useQuery(api.users.getSettings);
    const updateSettings = useMutation(api.users.updateSettings);
    const [selectedTheme, setSelectedTheme] = useState("minimalistic-light");
    const [isSaving, setIsSaving] = useState(false);
    const { getLabel, isCyber } = useThemeLabels();

    useEffect(() => {
        if (userSettings?.theme) {
            setSelectedTheme(userSettings.theme);
        }
    }, [userSettings]);

    const handleThemeChange = async (themeId: string) => {
        setSelectedTheme(themeId);
        setIsSaving(true);
        try {
            await updateSettings({ theme: themeId });
            document.documentElement.setAttribute("data-theme", themeId);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="max-w-4xl mx-auto px-6 py-12 w-full">
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-[var(--foreground)]">{getLabel("settings")}</h1>
                    <p className="text-[var(--text-muted)] font-medium text-lg">
                        {isCyber ? "// Personalizuj swoje doświadczenie" : "Dopasuj wygląd aplikacji do swoich preferencji."}
                    </p>
                </div>

                <div className="card-premium">
                    <div className="flex items-center gap-4 mb-10">
                        <div className={`p-3 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)] text-white rounded-xl"}`}>
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{isCyber ? "MOTYW_INTERFEJSU" : "Motyw wizualny"}</h2>
                            <p className="text-sm text-[var(--text-muted)] font-medium">{isCyber ? "// Wybierz preferowany styl wizualny" : "Wybierz jak ma wyglądać Twoja przestrzeń nauki."}</p>
                        </div>
                        {isSaving && <Loader2 className="w-5 h-5 ml-auto animate-spin text-[var(--primary)]" />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {themes.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => handleThemeChange(theme.id)}
                                className={`p-6 border text-left transition-all duration-300 relative group ${selectedTheme === theme.id
                                    ? "border-[var(--primary)] bg-[var(--primary)]/[0.03] ring-1 ring-[var(--primary)]"
                                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                                    } ${isCyber ? "" : "rounded-2xl"}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className="w-12 h-12 rounded-xl shadow-inner border border-black/5"
                                        style={{ backgroundColor: theme.color }}
                                    />
                                    {selectedTheme === theme.id && (
                                        <div className="p-1 bg-[var(--primary)] text-white rounded-full">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-lg mb-1">{theme.name}</h3>
                                <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">{theme.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
