
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import { authKit } from "./auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
                // Avoid using Buffer if possible (might be undefined in some runtimes)
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

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

            // Build prompt with all PDFs
            const result = await model.generateContent([
                ...pdfParts,
                `Przeanalizuj te pliki PDF (${pdfParts.length} plik${pdfParts.length > 1 ? 'ów' : ''}) i stwórz SZCZEGÓŁOWY plan nauki matematyki po polsku. Zwróć JSON zgodny z tą strukturą: { examTitle: string, phase1_theory: [{topic, content}], phase2_guided: [{question, steps: [], solution, tips}], phase3_exam: [{question, answer}] }. Bądź bardzo obszerny i połącz informacje ze wszystkich plików.`,
            ]);

            const text = result.response.text();
            // Thinking models often wrap the JSON at the very end or inside markdown blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Nie znaleziono poprawnego formatu JSON w odpowiedzi AI.");

            let data;
            try {
                // Remove potential markdown wrappers if they exist within the match
                const cleanedJson = jsonMatch[0].replace(/^```json\n?/, '').replace(/\n?```$/, '');
                data = JSON.parse(cleanedJson);
            } catch (parseError) {
                console.error("[AI] Błąd parsowania JSON:", parseError);
                throw new Error("Błąd struktury JSON wygenerowanej przez AI.");
            }

            await ctx.runMutation(api.exams.updateExamStatus, {
                id: args.examId,
                status: "ready",
                data: data,
            });

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
