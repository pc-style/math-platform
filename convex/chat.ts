import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { api } from "./_generated/api";
import { authKit } from "./auth";

export const askQuestion = action({
    args: {
        question: v.string(),
        context: v.string(), // Context of the current problem/step
        history: v.array(v.object({ role: v.union(v.literal("user"), v.literal("model")), text: v.string() })),
    },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check limits
        const userDetails = await ctx.runQuery(api.users.getUserDetails);
        if (userDetails && userDetails.role === "member") {
            if ((userDetails.monthlyMessages || 0) >= 100) {
                return "Osiągnięto limit 100 wiadomości w tym miesiącu. Przejdź na Premium po nielimitowany dostęp!";
            }
        }

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
                        text: `Jesteś Osobistym Tutorem Matematyki o imieniu "Mądrala". Twój styl to inteligentny, lekko kąśliwy sarkazm – jesteś genialny, zwięzły i potrafisz wyśmiać błędy w sposób, który bawi i uczy jednocześnie.
ZASADY:
1. ABSOLUTNY ZAKAZużywania emoji. Nie jesteśmy w przedszkolu.
2. Wyjaśniaj prosto, jakbyś tłumaczył to złotym rybkom, ale bez protekcjonalności.
3. Bądź ekstremalnie zwięzły (szanujmy swój czas).
4. Masz dostęp do całego planu nauki oraz aktualnego zadania ucznia.
5. Używaj LaTeX $...$ do wzorów.
6. Twój humor powinien opierać się na suchych żartach matematycznych lub lekkiej ironii co do trudności zadania.

KONTEKST:
${args.context}
` }],
                },
                ...historyParts,
                {
                    role: 'user',
                    parts: [{ text: args.question }]
                }
            ],
        });

        // Increment usage for members
        if (userDetails && userDetails.role === "member") {
            await ctx.runMutation(api.users.incrementUsage, { type: "messages" });
        }

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
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check limits
        const userDetails = await ctx.runQuery(api.users.getUserDetails);
        if (userDetails && userDetails.role === "member") {
            if ((userDetails.monthlyMessages || 0) >= 100) {
                return "Osiągnięto limit 100 wiadomości w tym miesiącu. Przejdź na Premium po nielimitowany dostęp!";
            }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Jesteś przyjaznym nauczycielem matematyki, który potrafi wyjaśniać najtrudniejsze zagadnienia w PRZEJRZYSTY i PROSTY sposób (technika Feynmana).
TEMAT: ${args.topic}
TREŚĆ:
${args.content}

ZADANIE:
${args.userQuery ? `Odpowiedz na pytanie ucznia dotyczące powyższego materiału: "${args.userQuery}"` : "Wyjaśnij powyższe zagadnienie używając techniki Feynmana. Bądź zabawny, zwięzły i nie używaj EMOJI."}

WYMAGANIA:
1. Używaj formatowania Markdown i LaTeX ($...$ lub $$...$$).
2. Dziel tekst na krótkie akapity.
3. Bądź zwięzły.
4. ZAKAZ UŻYWANIA EMOJI.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        // Increment usage for members
        if (userDetails && userDetails.role === "member") {
            await ctx.runMutation(api.users.incrementUsage, { type: "messages" });
        }

        return response.text || "Nie udało się wygenerować wyjaśnienia.";
    },
});
