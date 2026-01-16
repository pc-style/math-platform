import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
const mockUser = { id: "public-user" };
import { GoogleGenAI, Type } from "@google/genai";

// --- Schema Definition ---

const learningPathSchema = {
  type: Type.OBJECT,
  properties: {
    examTitle: {
      type: Type.STRING,
      description: "A concise Polish title for this learning material.",
    },
    phase1_theory: {
      type: Type.ARRAY,
      description:
        "Phase 1: Review of key concepts, formulas, and definitions found in the source material.",
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING, description: "Name of the concept" },
          content: { type: Type.STRING, description: "Detailed explanation including formulas." },
        },
        required: ["topic", "content"],
      },
    },
    phase2_guided: {
      type: Type.ARRAY,
      description: "Phase 2: Example exercises with step-by-step walkthroughs.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: {
            type: Type.STRING,
            description: "Tytuł zadania lub treść problemu (LaTeX dozwolony)",
          },
          description: {
            type: Type.STRING,
            description: "Opis zadania, dane wejściowe, kontekst. (LaTeX dozwolony)",
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Kroki rozwiązania. Każdy krok to logiczna część procesu.",
          },
          hints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Seria podpowiedzi, które uczeń może odkrywać (np. "Zauważ, że trójkąt jest prostokątny", "Użyj twierdzenia Pitagorasa").',
          },
          solution: {
            type: Type.STRING,
            description: "Pełne rozwiązanie i wynik końcowy (w LaTeX).",
          },
        },
        required: ["question", "steps", "solution", "hints"],
      },
    },
    phase3_exam: {
      type: Type.ARRAY,
      description: "Phase 3: A test for the user to solve independently.",
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING, description: "The correct answer for grading" },
        },
        required: ["question", "answer"],
      },
    },
    flashcards: {
      type: Type.ARRAY,
      description:
        "Flashcards for active recall. front: Definition/Formula, back: Explanation/Result.",
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING },
          back: { type: Type.STRING },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["examTitle", "phase1_theory", "phase2_guided", "phase3_exam", "flashcards"],
};

// --- Mutations & Queries ---

export const getExams = query({
  args: {},
  handler: async (ctx) => {
    const user = mockUser;
    return await ctx.db
      .query("exams")
      .withIndex("by_user", (q) => q.eq("userId", user.id))
      .order("desc")
      .collect();
  },
});

export const getExam = query({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    const user = mockUser;
    const exam = await ctx.db.get(args.id);
    if (!exam || !user || exam.userId !== user.id) return null;
    return exam;
  },
});

export const createExam = mutation({
  args: {
    title: v.string(),
    storageIds: v.array(v.id("_storage")),
    isSpeedrun: v.optional(v.boolean()),
    hoursAvailable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = mockUser;
    // Limits removed for public access
    const role = "premium";

    const examId = await ctx.db.insert("exams", {
      userId: user.id,
      title: args.title,
      status: "generating",
      storageIds: args.storageIds,
      isSpeedrun: args.isSpeedrun,
      hoursAvailable: args.hoursAvailable,
      createdAt: Date.now(),
    });

    return examId;
  },
});

export const updateExamStatus = mutation({
  args: {
    id: v.id("exams"),
    status: v.union(v.literal("ready"), v.literal("error")),
    data: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      data: args.data,
      error: args.error,
    });
  },
});

// --- File Storage ---

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const storeFile = action({
  args: { file: v.bytes(), contentType: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = mockUser;
    // Convert bytes to Blob for storage.store
    const blob = new Blob([args.file], { type: args.contentType });
    return await ctx.storage.store(blob);
  },
});

// --- Actions & Misc ---

export const renameExam = mutation({
  args: { id: v.id("exams"), title: v.string() },
  handler: async (ctx, args) => {
    const user = mockUser;
    const exam = await ctx.db.get(args.id);
    if (!exam || !user || exam.userId !== user.id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, { title: args.title });
  },
});

export const deleteExam = mutation({
  args: { id: v.id("exams") },
  handler: async (ctx, args) => {
    const user = mockUser;
    const exam = await ctx.db.get(args.id);
    if (!exam || !user || exam.userId !== user.id) throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});

export const generateExam = action({
  args: {
    examId: v.id("exams"),
    storageIds: v.array(v.id("_storage")),
    isSpeedrun: v.optional(v.boolean()),
    hoursAvailable: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch all PDFs and convert to base64
      const pdfParts = [];
      for (const storageId of args.storageIds) {
        const pdfBlob = await ctx.storage.get(storageId);
        if (!pdfBlob) throw new Error(`PDF not found in storage: ${storageId}`);
        const pdfBuffer = await pdfBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(pdfBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
        );
        pdfParts.push({
          inlineData: {
            data: base64,
            mimeType: "application/pdf",
          },
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");

      const ai = new GoogleGenAI({ apiKey });

      // Build prompt with all PDFs
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [
          {
            role: "user",
            parts: [
              ...pdfParts,
              {
                text: `Jesteś wybitnym profesorem matematyki i ekspertem od dydaktyki. Twoim celem jest stworzenie SZCZEGÓŁOWEGO, ANGARAŻUJĄCEGO i SKUTECZNEGO planu nauki na podstawie przesłanych materiałów (PDF).
${args.isSpeedrun
                    ? `
🚨 TRYB ALARMOWY (SPEEDRUN): Użytkownik ma tylko ${args.hoursAvailable} godzin do egzaminu! 
TWOJE ZADANIE:
- Zastosuj zasadę Pareto (80/20). Skup się WYŁĄCZNIE na tematach, które pojawiają się najczęściej i mają największy wpływ na wynik.
- Pomiń mniej istotne szczegóły i zaawansowane dygresje.
- Ścieżka nauki musi być możliwa do przejścia w ${args.hoursAvailable} h.
- Bądź niezwykle zwięzły, ale konkretny.
- Phase 1 (Teoria) powinna zawierać tylko esencję + najważniejsze wzory.
- Phase 2 (Praktyka) powinna skupić się na typowych zadaniach egzaminacyjnych.
`
                    : ""
                  }

Analiza:
- Przeanalizuj dokładnie każdy przesłany plik.
- Wyciągnij kluczowe pojęcia, twierdzenia, wzory i metody rozwiązywania zadań.
- Zidentyfikuj typowe błędy i pułapki.
- ${args.isSpeedrun ? "Skup się na TOP 3-5 najważniejszych tematach." : "Stwórz kompleksową strukturę ze wszystkich plików."}

Generowanie Treści (WAŻNE: FORMATOWANIE I CZYTELNOŚĆ):
- Treść musi być czytelna i "oddychająca". Dziel tekst na krótkie akapity (max 3-4 zdania).
- Używaj często nowych linii, aby oddzielić myśli.
- WAŻNE: Główne wzory matematyczne MUSZĄ być w osobnych liniach (display mode) przy użyciu $$.
  Przykład:
  Zamiast pisać "Wzór na delte to $ \Delta = b^2 - 4ac $ i jest ważny", napisz:
  "Wzór na deltę to:
  $$ \Delta = b^2 - 4ac $$
  Jest on kluczowy w analizie..."
- Używaj pogrubień dla ważnych pojęć.
- Wzory w tekście (inline) używają pojedynczego dolara $.

Struktura Planu:
1. Faza 1 (Teoria):
   - Wyjaśnij pojęcia prostym, ale precyzyjnym językiem.
   - Pisz tak, jakbyś tłumaczył to inteligentnemu uczniowi, który widzi to pierwszy raz.
   - Używaj wypunktowań, aby rozbić ściany tekstu.
   - Dodaj intuicyjne wyjaśnienia "dlaczego to działa".
   - ${args.isSpeedrun ? "Pisz BARDZO krótko, skup się na skutecznym zapamiętaniu." : ""}

2. Faza 2 (Praktyka z Przewodnikiem):
   - To najważniejsba część. Stwórz zadania, które uczą myślenia.
   - Każde zadanie musi mieć 'steps' (kroki), które prowadzą ucznia za rękę.
   - W 'tips' (wskazówkach) zawrzyj pytania pomocnicze lub uwagi o błędach.
   - 'hints' (nowe pole) powinno zawierać serię małych podpowiedzi.
   - Sekcja ta powinna być ${args.isSpeedrun ? "złożona z zadań PEWNIAKÓW (największe prawdopodobieństwo na egzaminie)." : "bardzo rozbudowana."}

3. Faza 3 (Egzamin):
   - Zadania sprawdzające wiedzę z Fazy 1 i umiejętności z Fazy 2.
   - Podaj tylko ostateczne odpowiedzi.

4. Fiszki (flashcards):
   - Wygeneruj zestaw 10-15 fiszek do szybkiej powtórki.
   - Front powinien zawierać pojęcie, nazwę twierdzenia lub lewą stronę ważnego wzoru.
   - Back powinien zawierać wyjaśnienie, definicję lub prawą stronę wzoru.

Bądź kreatywny, ale merytorycznie rygorystyczny. Traktuj użytkownika jak inteligentnego studenta, który chce zrozumieć, a nie tylko zdać.
Wygeneruj dużo treści. Nie oszczędzaj na wyjaśnieniach. Twoim priorytetem jest JASNOŚĆ i CZYTELNOŚĆ.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: learningPathSchema,
          thinkingConfig: { thinkingBudget: 4096 },
        },
      });

      const responseText = response.text;
      if (responseText) {
        const data = JSON.parse(responseText);

        await ctx.runMutation(api.exams.updateExamStatus, {
          id: args.examId,
          status: "ready",
          data: data,
        });
        return;
      }

      throw new Error("Model nie zwrócił poprawnego JSONa.");
    } catch (e) {
      console.error(e);
      await ctx.runMutation(api.exams.updateExamStatus, {
        id: args.examId,
        status: "error",
        error: (e as Error).message,
      });
    }
  },
});
