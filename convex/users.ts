import { v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { authKit } from "./auth";

export const testSync = internalMutation({
    args: { userId: v.string(), email: v.string() },
    handler: async (ctx, args) => {
        return await syncUserLogic(ctx, { id: args.userId, email: args.email });
    },
});

export const LIMITS = {
    MEMBER: {
        PROJECTS_AT_ONCE: 3,
        MONTHLY_GENERATIONS: 5,
        MONTHLY_MESSAGES: 100,
        MONTHLY_AUDIO_SECONDS: 300, // 5 min
    },
};

const getRole = (user: { metadata?: { role?: string } }) => {
    // If WorkOS passes roles in metadata or another field
    // For now we assume 'member' as default unless specified
    return user.metadata?.role || "member";
};

/**
 * Internal logic for syncing user stats, used by mutation and webhooks.
 * IMPORTANT: Does NOT overwrite existing premium/admin roles from the database.
 */
export async function syncUserLogic(ctx: MutationCtx, user: { id: string, email: string, metadata?: { role?: string } }) {
    const metadataRole = getRole(user);
    const now = Date.now();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthTs = startOfMonth.getTime();

    const record = await ctx.db
        .query("users")
        .withIndex("by_user", (q) => q.eq("userId", user.id))
        .first();

    if (!record) {
        await ctx.db.insert("users", {
            userId: user.id,
            email: user.email,
            role: metadataRole,
            theme: "minimalistic-warm",
            xp: 0,
            streak: 1,
            lastLogin: now,
            lastResetAt: startOfMonthTs,
            monthlyGenerations: 0,
            monthlyMessages: 0,
            monthlyAudioSeconds: 0,
        });
        return { xp: 0, streak: 1, role: metadataRole };
    }

    // Preserve existing premium/admin role - don't overwrite with "member" from metadata
    const existingRole = record.role;
    const isPremiumOrAdmin = existingRole === "premium" || existingRole === "admin";
    const finalRole = isPremiumOrAdmin ? existingRole : metadataRole;

    const patch: Partial<Doc<"users">> = { lastLogin: now, role: finalRole, email: user.email };

    // Monthly Reset
    if ((record.lastResetAt || 0) < startOfMonthTs) {
        patch.lastResetAt = startOfMonthTs;
        patch.monthlyGenerations = 0;
        patch.monthlyMessages = 0;
        patch.monthlyAudioSeconds = 0;
    }

    // Streak logic
    const lastLogin = record.lastLogin || 0;
    const lastDate = new Date(lastLogin).toDateString();
    const todayDate = new Date(now).toDateString();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const yesterdayDate = new Date(now - oneDayMs).toDateString();

    if (lastDate !== todayDate) {
        let newStreak = record.streak || 1;
        if (lastDate === yesterdayDate) {
            newStreak++;
        } else {
            newStreak = 1;
        }
        patch.streak = newStreak;
    }

    await ctx.db.patch(record._id, patch);

    return {
        xp: record.xp || 0,
        streak: patch.streak || record.streak || 1,
        role: finalRole,
        usage: {
            generations: patch.monthlyGenerations ?? record.monthlyGenerations ?? 0,
            messages: patch.monthlyMessages ?? record.monthlyMessages ?? 0,
            audioSeconds: patch.monthlyAudioSeconds ?? record.monthlyAudioSeconds ?? 0,
        }
    };
}

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return null;

        const settings = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        return settings || { theme: "minimalistic-warm", role: "member" };
    },
});

export const updateSettings = mutation({
    args: {
        theme: v.optional(v.string()),
        customizations: v.optional(v.object({
            primaryColor: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...(args.theme && { theme: args.theme }),
                ...(args.customizations && { customizations: args.customizations }),
            });
        } else {
            // If they don't have a record yet, create it with syncUserLogic
            await syncUserLogic(ctx, { id: user.id, email: user.email, metadata: user.metadata });
            // Then patch with theme
            const updated = await ctx.db
                .query("users")
                .withIndex("by_user", (q) => q.eq("userId", user.id))
                .first();
            if (updated) {
                await ctx.db.patch(updated._id, {
                    ...(args.theme && { theme: args.theme }),
                    ...(args.customizations && { customizations: args.customizations }),
                });
            }
        }
    },
});

export const syncStats = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return null;
        return await syncUserLogic(ctx, { id: user.id, email: user.email, metadata: user.metadata });
    },
});

export const addXp = mutation({
    args: { amount: v.number() },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return;

        const record = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        if (record) {
            await ctx.db.patch(record._id, {
                xp: (record.xp || 0) + args.amount,
            });
        }
    },
});

export const incrementUsage = mutation({
    args: {
        type: v.union(v.literal("generations"), v.literal("messages"), v.literal("audio")),
        amount: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return;

        const record = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        if (record) {
            const patch: Partial<Doc<"users">> = {};
            if (args.type === "generations") patch.monthlyGenerations = (record.monthlyGenerations || 0) + 1;
            if (args.type === "messages") patch.monthlyMessages = (record.monthlyMessages || 0) + 1;
            if (args.type === "audio") patch.monthlyAudioSeconds = (record.monthlyAudioSeconds || 0) + (args.amount || 0);
            await ctx.db.patch(record._id, patch);
        }
    },
});

export const getUserDetails = query({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return null;

        const record = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        if (!record) return null;

        return {
            ...record,
            limits: roleIsPremium(record.role) ? null : LIMITS.MEMBER
        };
    }
});

function roleIsPremium(role?: string) {
    return role === "admin" || role === "premium";
}
