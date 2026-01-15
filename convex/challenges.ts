import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all challenges grouped by category
export const list = query({
  args: {},
  handler: async (ctx) => {
    const challenges = await ctx.db.query("challenges").collect();
    // Grouping by category could be done here or in the client
    return challenges;
  },
});

// Get a single challenge by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

// Get user progress for a specific challenge
export const getProgress = query({
  args: { userId: v.string(), challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId),
      )
      .unique();
  },
});

// Start or update progress (e.g., tracking attempts)
export const updateProgress = mutation({
  args: {
    userId: v.string(),
    challengeId: v.id("challenges"),
    status: v.union(v.literal("unlocked"), v.literal("completed")),
    hintsUsed: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("challengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        hintsUsed: Math.max(existing.hintsUsed, args.hintsUsed),
        attempts: existing.attempts + 1,
        completedAt: args.status === "completed" ? Date.now() : existing.completedAt,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("challengeProgress", {
        userId: args.userId,
        challengeId: args.challengeId,
        status: args.status,
        attempts: 1,
        hintsUsed: args.hintsUsed,
        completedAt: args.status === "completed" ? Date.now() : undefined,
      });
    }
  },
});

// Complete challenge and award XP
export const complete = mutation({
  args: {
    userId: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!user) throw new Error("User not found");

    // Update progress
    const progress = await ctx.db
      .query("challengeProgress")
      .withIndex("by_user_challenge", (q) =>
        q.eq("userId", args.userId).eq("challengeId", args.challengeId),
      )
      .unique();

    let xpAwarded = false;
    const xpReward = challenge.xpReward;

    if (progress) {
      // If already completed, don't award XP again
      if (progress.status !== "completed") {
        await ctx.db.patch(progress._id, {
          status: "completed",
          xpEarned: xpReward,
          completedAt: Date.now(),
        });

        // Update user XP
        await ctx.db.patch(user._id, {
          xp: (user.xp ?? 0) + xpReward,
        });
        xpAwarded = true;
      }
    } else {
      // New completion
      await ctx.db.insert("challengeProgress", {
        userId: args.userId,
        challengeId: args.challengeId,
        status: "completed",
        attempts: 1,
        hintsUsed: 0,
        xpEarned: xpReward,
        completedAt: Date.now(),
      });

      await ctx.db.patch(user._id, {
        xp: (user.xp ?? 0) + xpReward,
      });
      xpAwarded = true;
    }

    const currentXp = user.xp ?? 0;
    const finalXp = xpAwarded ? currentXp + xpReward : currentXp;

    return {
      success: true,
      xpAwarded,
      xpEarned: xpAwarded ? xpReward : 0,
      newXp: finalXp,
    };
  },
});

// Seed initial challenges
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const challenges = [
      {
        slug: "center-the-div",
        title: "Center the Div",
        description:
          "Use CSS Flexbox to perfectly center the pink square inside its container. The container is a full-screen height section.",
        category: "CSS Basics",
        difficulty: 1,
        xpReward: 100,
        starterCode: {
          html: '<div class="container">\n  <div class="box"></div>\n</div>',
          css: ".container {\n  height: 50vh;\n  border: 2px dashed #8b8076;\n}\n\n.box {\n  width: 100px;\n  height: 100px;\n  background: #ff00ff;\n  box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);\n}",
          js: "",
        },
        validation: {
          type: "computed-style",
          rules: [
            {
              selector: ".container",
              property: "display",
              expected: "flex",
              hint: "Try setting the display property of the container to flex.",
            },
            {
              selector: ".container",
              property: "justifyContent",
              expected: "center",
              hint: "Use justify-content: center to center along the main axis.",
            },
            {
              selector: ".container",
              property: "alignItems",
              expected: "center",
              hint: "Use align-items: center to center along the cross axis.",
            },
          ],
        },
        hints: [
          "The parent container needs a specific layout mode.",
          "Flexbox is the most modern way to do this. Try `display: flex;`.",
          "To center vertically and horizontally in flexbox, you need two properties: `justify-content` and `align-items`.",
        ],
        order: 1,
      },
    ];

    for (const challenge of challenges) {
      const existing = await ctx.db
        .query("challenges")
        .withIndex("by_slug", (q) => q.eq("slug", challenge.slug))
        .unique();

      if (!existing) {
        await ctx.db.insert("challenges", challenge);
      }
    }
  },
});

export const insertBatch = mutation({
  args: {
    challenges: v.array(
      v.object({
        slug: v.string(),
        title: v.string(),
        description: v.string(),
        category: v.string(),
        difficulty: v.number(),
        xpReward: v.number(),
        starterCode: v.object({
          html: v.string(),
          css: v.string(),
          js: v.optional(v.string()),
        }),
        validation: v.object({
          type: v.string(),
          rules: v.array(
            v.object({
              selector: v.string(),
              property: v.string(),
              expected: v.string(),
              hint: v.string(),
            }),
          ),
        }),
        hints: v.array(v.string()),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const challenge of args.challenges) {
      const existing = await ctx.db
        .query("challenges")
        .withIndex("by_slug", (q) => q.eq("slug", challenge.slug))
        .unique();

      if (!existing) {
        await ctx.db.insert("challenges", challenge);
      } else {
        // Optional: Update existing? For now, skip or patch.
        // Let's patch to allow updates.
        await ctx.db.patch(existing._id, challenge);
      }
    }
    return { count: args.challenges.length };
  },
});
