"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Palette, Check, Loader2, Zap, Home, Monitor } from "lucide-react";
import { Header } from "@/components/Header";
import { useThemeLabels } from "@/hooks/useThemeLabels";

const themes = [
  {
    id: "minimalistic-light",
    name: "Modern White",
    description: "Jasny, profesjonalny i czytelny",
    color: "#ffffff",
  },
  {
    id: "minimalistic-dark",
    name: "Pure Dark",
    description: "Elegancki ciemny motyw",
    color: "#0a0a0a",
  },
  {
    id: "minimalistic-warm",
    name: "Paper Warm",
    description: "Ciepły, łagodny dla oczu",
    color: "#fbfaf5",
  },
  {
    id: "cybernetic-dark",
    name: "Cyber Pink",
    description: "Ekspresyjny styl deweloperski",
    color: "#ff00ff",
  },
  {
    id: "high-contrast",
    name: "High Contrast",
    description: "Maksymalny kontrast i wyraziste soczyste akcenty",
    color: "#000000",
  },
];

export default function SettingsPage() {
  const userSettings = useQuery(api.users.getUserDetails);
  const updateSettings = useMutation(api.users.updateSettings);
  const [selectedTheme, setSelectedTheme] = useState("minimalistic-light");
  const [isSaving, setIsSaving] = useState(false);
  const [prefersSystemTheme, setPrefersSystemTheme] = useState(false);
  const [isSavingSystemSync, setIsSavingSystemSync] = useState(false);
  const [solverAsHomepage, setSolverAsHomepage] = useState(false);
  const { getLabel, isCyber } = useThemeLabels();

  useEffect(() => {
    if (userSettings?.theme) {
      setSelectedTheme(userSettings.theme);
    }
    if (typeof userSettings?.prefersSystemTheme === "boolean") {
      setPrefersSystemTheme(userSettings.prefersSystemTheme);
    }
  }, [userSettings]);

  // Sync DB settings
  useEffect(() => {
    if (userSettings?.solverDefaultHomepage !== undefined) {
      setSolverAsHomepage(userSettings.solverDefaultHomepage);
      localStorage.setItem("solver-default-homepage", String(userSettings.solverDefaultHomepage));
    }
  }, [userSettings]);

  // Initial load from localStorage for speed
  useEffect(() => {
    const saved = localStorage.getItem("solver-default-homepage");
    if (saved !== null) {
      setSolverAsHomepage(saved === "true");
    }
  }, []);

  const handleThemeChange = async (themeId: string) => {
    setIsSaving(true);
    try {
      const payload: Parameters<typeof updateSettings>[0] = { theme: themeId };
      if (prefersSystemTheme) {
        payload.prefersSystemTheme = false;
      }
      await updateSettings(payload);
      document.documentElement.setAttribute("data-theme", themeId);
      setSelectedTheme(themeId);
      if (prefersSystemTheme) {
        setPrefersSystemTheme(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSolverHomepage = async () => {
    const newValue = !solverAsHomepage;
    setSolverAsHomepage(newValue);
    localStorage.setItem("solver-default-homepage", String(newValue));
    await updateSettings({ solverDefaultHomepage: newValue });
  };

  const toggleSystemTheme = async () => {
    const nextValue = !prefersSystemTheme;
    setIsSavingSystemSync(true);
    try {
      await updateSettings({ prefersSystemTheme: nextValue });
      setPrefersSystemTheme(nextValue);
      if (!nextValue) {
        document.documentElement.setAttribute("data-theme", selectedTheme);
      } else if (typeof window !== "undefined") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const autoTheme = prefersDark ? "minimalistic-dark" : "minimalistic-light";
        document.documentElement.setAttribute("data-theme", autoTheme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSystemSync(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-[var(--foreground)]">
            {getLabel("settings")}
          </h1>
          <p className="text-[var(--text-muted)] font-medium text-lg">
            {isCyber
              ? "// Personalizuj swoje doświadczenie"
              : "Dopasuj wygląd aplikacji do swoich preferencji."}
          </p>
        </div>

        {/* Solver Homepage Setting */}
        <div className="card-premium mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)] text-white rounded-xl"}`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{isCyber ? "SOLVER_DOMYŚLNY" : "Szybki Solver"}</h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                {isCyber
                  ? "// Ustaw Solver jako stronę startową"
                  : "Otwieraj Solver zamiast pulpitu po wejściu do aplikacji."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-[var(--text-muted)]" />
              <div>
                <p className="font-medium text-sm">Solver jako strona główna</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Automatycznie otwieraj Solver po wejściu na stronę
                </p>
              </div>
            </div>
            <button
              onClick={toggleSolverHomepage}
              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                solverAsHomepage ? "bg-[var(--primary)]" : "bg-[var(--border)]"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  solverAsHomepage ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* System Theme Sync */}
        <div className="card-premium mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`p-3 ${
                isCyber
                  ? "border border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--primary)] text-white rounded-xl"
              }`}
            >
              <Monitor className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {isCyber ? "AUTOMATYCZNY_TEMAT" : "Synchronizacja z systemem"}
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                {isCyber
                  ? "// Styl podąża za preferencjami motywu Twojego systemu."
                  : "Gdy włączone, aplikacja przyjmuje jasny lub ciemny motyw twojego systemu."}
              </p>
            </div>
            {isSavingSystemSync && (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <Monitor className="w-4 h-4 text-[var(--text-muted)]" />
              <div>
                <p className="font-medium text-sm">Systemowy motyw</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {prefersSystemTheme
                    ? "Kontrola manualna jest wyłączona."
                    : "Wybierz dowolny motyw poniżej."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleSystemTheme}
              disabled={isSavingSystemSync}
              aria-pressed={prefersSystemTheme}
              aria-label="Toggle automatic system theme sync"
              className={`w-12 h-6 rounded-full transition-all duration-200 ${
                prefersSystemTheme ? "bg-[var(--primary)]" : "bg-[var(--border)]"
              } ${isSavingSystemSync ? "opacity-60 cursor-wait" : ""}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  prefersSystemTheme ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card-premium">
          <div className="flex items-center gap-4 mb-10">
            <div
              className={`p-3 ${isCyber ? "border border-[var(--primary)] text-[var(--primary)]" : "bg-[var(--primary)] text-white rounded-xl"}`}
            >
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isCyber ? "MOTYW_INTERFEJSU" : "Motyw wizualny"}
              </h2>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                {isCyber
                  ? "// Wybierz preferowany styl wizualny"
                  : "Wybierz jak ma wyglądać Twoja przestrzeń nauki."}
              </p>
            </div>
            {isSaving && <Loader2 className="w-5 h-5 ml-auto animate-spin text-[var(--primary)]" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                disabled={prefersSystemTheme}
                className={`p-6 border text-left transition-all duration-300 relative group ${
                  selectedTheme === theme.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/[0.03] ring-1 ring-[var(--primary)]"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                } ${isCyber ? "" : "rounded-2xl"} ${
                  prefersSystemTheme ? "cursor-not-allowed opacity-60" : ""
                }`}
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
                <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed">
                  {theme.description}
                </p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {prefersSystemTheme
              ? "Systemowa synchronizacja ma pierwszeństwo. Wyłącz ją, by ręcznie wybrać motyw."
              : "Wybierz motyw, by dopasować wygląd aplikacji do siebie."}
          </p>
        </div>
      </div>
    </div>
  );
}
