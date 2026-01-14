
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

        return settings || { theme: "cybernetic-dark" };
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
                theme: args.theme || "cybernetic-dark",
                customizations: args.customizations,
            });
        }
    },
});
