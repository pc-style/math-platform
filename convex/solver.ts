import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenAI } from "@google/genai";
import { api } from "./_generated/api";
import { authKit } from "./auth";

export const solveExercise = action({
    args: {
        image: v.optional(v.string()), // Base64
        pdf: v.optional(v.string()), // Base64
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        // Check limits
        const userDetails = await ctx.runQuery(api.users.getUserDetails);
        const role = userDetails?.role || "member";

        // Members might have stricter limits for solver, but for now we reuse message limit or ignore
        // Assuming solver uses more tokens, maybe track differently.
        // For this task, we'll just track as a message.
        if (role === "member" && userDetails) {
            if ((userDetails.monthlyMessages || 0) >= 100) {
                return "Osiągnięto limit 100 wiadomości. Przejdź na Premium!";
            }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY not set");

        const ai = new GoogleGenAI({ apiKey });

        const contents = [];

        if (args.text) {
             contents.push({ role: 'user', parts: [{ text: "Proszę rozwiąż to zadanie. " + args.text }] });
        } else {
             contents.push({ role: 'user', parts: [{ text: "Proszę rozwiąż to zadanie z załącznika." }] });
        }

        // Handle Image
        if (args.image) {
            // Remove header if present (e.g. "data:image/png;base64,")
            const base64Image = args.image.split(',')[1] || args.image;
            contents[0].parts.push({
                inlineData: {
                    mimeType: "image/png", // Assuming PNG or JPEG, usually safe for Gemini
                    data: base64Image
                }
            });
        }

        // Handle PDF
        if (args.pdf) {
             const base64Pdf = args.pdf.split(',')[1] || args.pdf;
             contents[0].parts.push({
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Pdf
                }
            });
        }

        const prompt = `
Jesteś ekspertem matematycznym. Twoim zadaniem jest rozwiązanie przesłanego zadania (tekst, zdjęcie lub PDF).
ZASADY:
1. Przedstaw rozwiązanie KROK PO KROKU.
2. Używaj formatowania LaTeX do wzorów (wewnątrz $...$ lub $$...$$).
3. Bądź precyzyjny i sprawdzaj obliczenia.
4. Na końcu podaj zwięzłą odpowiedź końcową.
5. Formatuj tekst używając Markdown (pogrubienia, listy).
`;

        // Prepend system instruction-like prompt to the user message since specific system instruction might be separate
        // But for 'generateContent', we often just put it in the first user part or use systemInstruction if supported.
        // GoogleGenAI SDK supports systemInstruction.

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            config: {
                systemInstruction: prompt
            },
            contents: contents,
        });

        // Increment usage
        if (role === "member" && userDetails) {
            await ctx.runMutation(api.users.incrementUsage, { type: "messages" });
        }

        return response.text || "Nie udało się rozwiązać zadania.";
    },
});
