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
