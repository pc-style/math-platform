
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // Exams/Learning Paths
    exams: defineTable({
        userId: v.string(), // WorkOS User ID
        title: v.string(),
        status: v.union(
            v.literal("generating"),
            v.literal("ready"),
            v.literal("error")
        ),
        storageId: v.optional(v.id("_storage")), // The uploaded PDF
        data: v.optional(
            v.object({
                examTitle: v.string(),
                phase1_theory: v.array(
                    v.object({
                        topic: v.string(),
                        content: v.string(),
                    })
                ),
                phase2_guided: v.array(
                    v.object({
                        question: v.string(),
                        steps: v.array(v.string()),
                        solution: v.string(),
                        tips: v.optional(v.string()),
                    })
                ),
                phase3_exam: v.array(
                    v.object({
                        question: v.string(),
                        answer: v.string(),
                    })
                ),
            })
        ),
        error: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),
});
