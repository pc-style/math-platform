
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authKit } from "./auth";

export const getSettings = query({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return null;

        const settings = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        return settings || { theme: "minimalistic-warm" };
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
            await ctx.db.insert("users", {
                userId: user.id,
                theme: args.theme || "minimalistic-warm",
                customizations: args.customizations,
                xp: 0,
                streak: 1,
                lastLogin: Date.now(),
            });
        }
    },
});

export const syncStats = mutation({
    args: {},
    handler: async (ctx) => {
        const user = await authKit.getAuthUser(ctx);
        if (!user) return null;

        const record = await ctx.db
            .query("users")
            .withIndex("by_user", (q) => q.eq("userId", user.id))
            .first();

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        if (!record) {
            // New user record if somehow missing
            const id = await ctx.db.insert("users", {
                userId: user.id,
                theme: "minimalistic-warm",
                xp: 0,
                streak: 1,
                lastLogin: now,
            });
            return { xp: 0, streak: 1 };
        }

        const lastLogin = record.lastLogin || 0;
        const diff = now - lastLogin;

        // Logical day check (naive 24h window for simplicity, or calendar day match)
        // Better: Check if `lastLogin` is from "yesterday" relative to "today".
        const lastDate = new Date(lastLogin).toDateString();
        const todayDate = new Date(now).toDateString();

        // If logged in today, do nothing
        if (lastDate === todayDate) {
            return { xp: record.xp || 0, streak: record.streak || 1 };
        }

        // Using simple time diff to check if within 48h (streak valid) or more (streak broken)
        // But checking consecutive calendar days is robust enough for now.
        // If more than 1 calendar day passed, reset.
        const yesterdayDate = new Date(now - oneDayMs).toDateString();

        let newStreak = record.streak || 1;
        if (lastDate === yesterdayDate) {
            newStreak++;
        } else {
            // Streak broken (missed at least one day)
            newStreak = 1;
        }

        await ctx.db.patch(record._id, {
            streak: newStreak,
            lastLogin: now,
        });

        return { xp: record.xp || 0, streak: newStreak };
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
