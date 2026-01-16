import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const mockUser = {
    id: "public-user",
    role: "premium" as const,
    monthlyMessages: 0,
    monthlyAudioSeconds: 0,
    theme: "cybernetic-dark",
    solverDefaultHomepage: false,
    solverKnowledgeBase: [] as any[],
    solverSystemPrompt: "",
    xp: 0,
    level: 1,
};

export const getUserDetails = query({
    args: {},
    handler: async (ctx) => {
        return mockUser;
    },
});

export const addXp = mutation({
    args: { amount: v.number() },
    handler: async (ctx, args) => {
        // No-op for public users
        return;
    },
});

export const incrementUsage = mutation({
    args: {
        type: v.union(v.literal("text"), v.literal("audio")),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        // No-op for public users
        return;
    },
});

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        return {
            theme: "cybernetic-dark",
            solverDefaultHomepage: false,
            solverKnowledgeBase: "",
            solverSystemPrompt: "",
        };
    },
});

export const updateSettings = mutation({
    args: {
        theme: v.optional(v.string()),
        solverDefaultHomepage: v.optional(v.boolean()),
        solverKnowledgeBase: v.optional(v.any()),
        solverSystemPrompt: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // No-op for public users
        return;
    },
});

export const syncStats = mutation({
    args: {},
    handler: async (ctx) => {
        // No-op for public users
        return;
    },
});
