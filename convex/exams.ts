
import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authKit } from "./auth";
import { GoogleGenAI } from "@google/genai";

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
    args: { title: v.string(), storageId: v.optional(v.id("_storage")) },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const examId = await ctx.db.insert("exams", {
            userId: user.id,
            title: args.title,
            status: "generating",
            storageId: args.storageId,
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
    args: { examId: v.id("exams"), storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        const exam = await ctx.runQuery(api.exams.getExam, { id: args.id }); // Note: API might be slightly different depending on _generated
        // Re-check auth or just proceed since it's an internal/action call triggered by user

        try {
            const pdfBuffer = await ctx.storage.get(args.storageId);
            if (!pdfBuffer) throw new Error("PDF not found in storage");

            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error("GEMINI_API_KEY not set");

            const genAI = new GoogleGenAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use 1.5 flash for speed/cost

            const result = await model.generateContent([
                {
                    inlineData: {
                        data: Buffer.from(pdfBuffer).toString("base64"),
                        mimeType: "application/pdf",
                    },
                },
                "Przeanalizuj ten plik PDF i stwórz SZCZEGÓŁOWY plan nauki matematyki po polsku. Zwróć JSON zgodny z tą strukturą: { examTitle: string, phase1_theory: [{topic, content}], phase2_guided: [{question, steps: [], solution, tips}], phase3_exam: [{question, answer}] }. Bądź bardzo obszerny.",
            ]);

            const text = result.response.text();
            // Simple JSON extraction (Gemini might wrap in markdown)
            const jsonStr = text.match(/\{[\s\S]*\}/)?.[0];
            if (!jsonStr) throw new Error("Failed to parse AI response as JSON");

            const data = JSON.parse(jsonStr);

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
