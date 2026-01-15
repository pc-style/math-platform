import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";

export const askQuestion = action({
    args: {
        question: v.string(),
        context: v.string(), // Context of the current problem/step
        history: v.array(v.object({ role: v.union(v.literal("user"), v.literal("model")), text: v.string() })),
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        const ai = new GoogleGenAI({ apiKey });

        const historyParts = args.history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }));

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    role: 'user',
                    parts: [{
                        text: `Jesteś entuzjastycznym, wspierającym i cierpliwym korepetytorem matematyki. Twoim celem jest nie tylko nauczyć, ale i zmotywować ucznia!
KONTEKST ZADANIA:
${args.context}

ZASADY:
1. Bądź pełen energii! Używaj zwrotów typu "Świetne pytanie!", "Idziesz w dobrą stronę!", "Prawie mamy to!".
2. Używaj emoji (🚀, ✨, 💪, 🧠), aby ożywić rozmowę.
3. Metoda sokratejska: naprowadzaj pytaniami, nie dawaj gotowców.
4. Świętuj małe sukcesy. Jak uczeń dobrze odpowie, pochwal go konkretnie.
5. Używaj LaTeX $...$ do wzorów.
6. Bądź zwięzły, ale ciepły.
` }],
                },
                ...historyParts,
                {
                    role: 'user',
                    parts: [{ text: args.question }]
                }
            ],
        });

        return response.text || "Przepraszam, nie udało mi się wygenerować odpowiedzi.";
    },
});

export const explainTheory = action({
    args: {
        topic: v.string(),
        content: v.string(),
        userQuery: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Jesteś przyjaznym nauczycielem matematyki, który potrafi wyjaśniać najtrudniejsze zagadnienia w PRZEJRZYSTY i PROSTY sposób (technika Feynmana).
TEMAT: ${args.topic}
TREŚĆ:
${args.content}

ZADANIE:
${args.userQuery ? `Odpowiedz na pytanie ucznia dotyczące powyższego materiału: "${args.userQuery}"` : "Wyjaśnij powyższe zagadnienie używając prostszego języka, intuicyjnych przykładów i analogii z życia codziennego. Unikaj żargonu, jeśli to możliwe, lub go od razu tłumacz."}

WYMAGANIA:
1. Używaj formatowania Markdown i LaTeX ($...$ dla inline, $$...$$ dla osobnych linii co jest BARDZO WAŻNE dla czytelności).
2. Dziel tekst na krótkie akapity. Rób odstępy.
3. Bądź zwięzły i konkretny.
4. Użyj tonu zachęcającego i lekkiego (z emoji ✨, 💡).
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        return response.text || "Nie udało się wygenerować wyjaśnienia.";
    },
});
