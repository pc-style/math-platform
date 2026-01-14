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
                        text: `Jesteś pomocnym, cierpliwym korepetytorem matematyki. Pomagasz uczniowi zrozumieć zadanie.
KONTEKST ZADANIA (O czym teraz rozmawiamy):
${args.context}

ZASADY:
1. Odpowiadaj krótko i konkretnie.
2. Nie podawaj od razu gotowego wyniku - naprowadzaj pytaniami.
3. Wykorzystuj metodę sokratejską (pytania, które prowadzą do odpowiedzi).
4. Jeśli uczeń błądzi, delikatnie go skoryguj.
5. Używaj LaTeX $...$ do wzorów matematycznych.
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
