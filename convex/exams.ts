import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { authKit } from "./auth";
import { GoogleGenAI, Type } from "@google/genai";

// --- Schema Definition ---

const learningPathSchema = {
    type: Type.OBJECT,
    properties: {
        examTitle: {
            type: Type.STRING,
            description: 'A concise Polish title for this learning material.',
        },
        phase1_theory: {
            type: Type.ARRAY,
            description: 'Phase 1: Review of key concepts, formulas, and definitions found in the source material.',
            items: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING, description: 'Name of the concept' },
                    content: { type: Type.STRING, description: 'Detailed explanation including formulas.' },
                },
                required: ['topic', 'content'],
            },
        },
        phase2_guided: {
            type: Type.ARRAY,
            description: 'Phase 2: Example exercises with step-by-step walkthroughs.',
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING, description: 'Tytuł zadania lub treść problemu (LaTeX dozwolony)' },
                    description: { type: Type.STRING, description: 'Opis zadania, dane wejściowe, kontekst. (LaTeX dozwolony)' },
                    steps: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Kroki rozwiązania. Każdy krok to logiczna część procesu.',
                    },
                    hints: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Seria podpowiedzi, które uczeń może odkrywać (np. "Zauważ, że trójkąt jest prostokątny", "Użyj twierdzenia Pitagorasa").'
                    },
                    solution: { type: Type.STRING, description: 'Pełne rozwiązanie i wynik końcowy (w LaTeX).' },
                },
                required: ['question', 'steps', 'solution', 'hints'],
            },
        },
        phase3_exam: {
            type: Type.ARRAY,
            description: 'Phase 3: A test for the user to solve independently.',
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING, description: 'The correct answer for grading' },
                },
                required: ['question', 'answer'],
            },
        },
    },
    required: ['examTitle', 'phase1_theory', 'phase2_guided', 'phase3_exam'],
};

// --- Mutations & Queries ---

export const getExams = query({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return [];
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
        const user = await authKit.getAuthUser(ctx);
        const exam = await ctx.db.get(args.id);
        if (!exam || !user || exam.userId !== user.id) return null;
        return exam;
    },
});

export const createExam = mutation({
    args: { title: v.string(), storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const examId = await ctx.db.insert("exams", {
            userId: user.id,
            title: args.title,
            status: "generating",
            storageIds: args.storageIds,
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
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");
        return await ctx.storage.store(new Blob([args.file], { type: args.contentType }));
    },
});

// --- AI Action ---

export const generateExam = action({
    args: { examId: v.id("exams"), storageIds: v.array(v.id("_storage")) },
    handler: async (ctx, args) => {
        try {
            // Fetch all PDFs and convert to base64
            const pdfParts = [];
            for (const storageId of args.storageIds) {
                const pdfBlob = await ctx.storage.get(storageId);
                if (!pdfBlob) throw new Error(`PDF not found in storage: ${storageId}`);
                const pdfBuffer = await pdfBlob.arrayBuffer();
                const base64 = btoa(
                    new Uint8Array(pdfBuffer)
                        .reduce((data, byte) => data + String.fromCharCode(byte), '')
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
                model: 'gemini-3-pro-preview',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            ...pdfParts,
                            {
                                text: `Jesteś wybitnym profesorem matematyki i ekspertem od dydaktyki. Twoim celem jest stworzenie SZCZEGÓŁOWEGO, ANGARAŻUJĄCEGO i SKUTECZNEGO planu nauki na podstawie przesłanych materiałów (PDF).

Analiza:
- Przeanalizuj dokładnie każdy przesłany plik.
- Wyciągnij kluczowe pojęcia, twierdzenia, wzory i metody rozwiązywania zadań.
- Zidentyfikuj typowe błędy i pułapki.

Generowanie Treści (WYMAGANE FORMATOWANIE LATEX DO WZORÓW MATEMATYCZNYCH):
- Wszystkie wzory matematyczne muszą być objęte znakami dolara.
- $E=mc^2$ dla wzorów w tekście.
- $$ \int_0^\infty x^2 dx $$ dla wzorów w nowej linii (display mode).
- Nie używaj \\( ... \\) ani \\[ ... \\]. Tylko $ i $$.
- Upewnij się, że LaTeX jest poprawny składniowo.

Struktura Planu:
1. Faza 1 (Teoria):
   - Wyjaśnij pojęcia prostym, ale precyzyjnym językiem.
   - Zawsze podawaj wzory w LaTeX.
   - Dodaj intuicyjne wyjaśnienia "dlaczego to działa".
   - Użyj Markdown do formatowania tekstu (pogrubienia, listy).

2. Faza 2 (Praktyka z Przewodnikiem):
   - To najważniejsza część. Stwórz zadania, które uczą myślenia.
   - Każde zadanie musi mieć 'steps' (kroki), które prowadzą ucznia za rękę.
   - W 'tips' (wskazówkach) zawrzyj pytania pomocnicze lub uwagi o błędach, które pojawiają się w danym kroku.
   - 'hints' (nowe pole) powinno zawierać serię małych podpowiedzi, które można odkrywać po kolei (np. strzałką).
   - Sekcja ta powinna być bardzo rozbudowana.

3. Faza 3 (Egzamin):
   - Zadania sprawdzające wiedzę z Fazy 1 i umiejętności z Fazy 2.
   - Podaj tylko ostateczne odpowiedzi, aby uczeń mógł się sprawdzić.

Bądź kreatywny, ale merytorycznie rygorystyczny. Traktuj użytkownika jak inteligentnego studenta, który chce zrozumieć, a nie tylko zdać.
Wygeneruj dużo treści. Nie oszczędzaj na wyjaśnieniach.`,
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
