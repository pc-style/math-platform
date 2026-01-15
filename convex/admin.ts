import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        // Exams
        const exams = await ctx.db.query("exams").collect();
        for (const exam of exams) {
            await ctx.db.delete(exam._id);
        }
        console.log(`Deleted ${exams.length} exams`);

        // Users
        const users = await ctx.db.query("users").collect();
        for (const user of users) {
            await ctx.db.delete(user._id);
        }
        console.log(`Deleted ${users.length} users`);

        return `Cleared ${exams.length} exams and ${users.length} users`;
    },
});

export const makePremium = mutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
        if (!user) {
            throw new Error(`User with email ${args.email} not found. They must log in at least once so their email is synced.`);
        }
        await ctx.db.patch(user._id, { role: "premium" });
        return { success: true, email: args.email };
    },
});
