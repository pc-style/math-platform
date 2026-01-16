import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenAI, createPartFromBase64, createPartFromText } from "@google/genai";

export const solveExercise = action({
  args: {
    prompt: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          mimeType: v.string(),
          data: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const ai = new GoogleGenAI({ apiKey });

    const parts = [];

    if (args.prompt) {
      parts.push(createPartFromText(args.prompt));
    }

    if (args.attachments) {
      args.attachments.forEach((attachment) => {
        parts.push(createPartFromText(`Plik: ${attachment.name}`));
        parts.push(createPartFromBase64(attachment.data, attachment.mimeType));
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: `Jesteś szybkim i dokładnym solverem zadań matematycznych. Analizuj obrazy, PDF i tekst.
ZASADY:
1. Zwracaj wynik w Markdown + LaTeX ($...$ i $$...$$).
2. Odpowiedź ma być konkretna: wynik + kluczowe kroki rozwiązania.
3. Bez emoji.
4. Jeśli brakuje danych lub obraz jest nieczytelny, krótko napisz czego brakuje.`,
      },
    });

    return response.text || "Nie udało się wygenerować odpowiedzi.";
  },
});
