
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
        storageIds: v.array(v.id("_storage")), // Multiple uploaded PDFs
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
                        description: v.optional(v.string()),
                        steps: v.array(v.string()),
                        solution: v.string(),
                        tips: v.optional(v.string()),
                        hints: v.optional(v.array(v.string())),
                    })
                ),
                phase3_exam: v.array(
                    v.object({
                        question: v.string(),
                        answer: v.string(),
                    })
                ),
                flashcards: v.optional(v.array(
                    v.object({
                        front: v.string(),
                        back: v.string(),
                    })
                )),
            })
        ),
        error: v.optional(v.string()),
        isSpeedrun: v.optional(v.boolean()),
        hoursAvailable: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // User Settings & Theme Preferences
    users: defineTable({
        userId: v.string(), // WorkOS User ID
        theme: v.string(), // e.g., 'cybernetic-dark', 'normal-light', etc.
        customizations: v.optional(v.object({
            primaryColor: v.optional(v.string()),
        })),
        xp: v.optional(v.number()),
        streak: v.optional(v.number()),
        lastLogin: v.optional(v.number()),
    }).index("by_user", ["userId"]),
});
