import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const courses = [
  {
    title: "HTML Semantics",
    slug: "html-semantics",
    description: "Master the structure of the web with semantic HTML.",
    icon: "Layout",
    order: 1,
    categories: ["HTML Semantics", "HTML"],
  },
  {
    title: "CSS Basics",
    slug: "css-basics",
    description: "Learn the fundamentals of styling.",
    icon: "Palette",
    order: 2,
    categories: ["CSS Basics", "CSS Visual"],
  },
  {
    title: "CSS Layout",
    slug: "css-layout",
    description: "Master Flexbox and Grid for layout control.",
    icon: "Grid",
    order: 3,
    categories: ["CSS Layout", "Flexbox", "Grid"],
  },
  {
    title: "Typography",
    slug: "typography",
    description: "The art of styling text for readability and aesthetics.",
    icon: "Type",
    order: 4,
    categories: ["Typography"],
  },
  {
    title: "JavaScript DOM",
    slug: "js-dom",
    description: "Interact with the page using JavaScript.",
    icon: "Code",
    order: 5,
    categories: ["JavaScript", "DOM Manipulation", "JS DOM"],
  },
];

async function seed() {
  console.log("🌱 Seeding courses...");

  for (const courseData of courses) {
    // 1. Create Course
    const { categories, ...courseArgs } = courseData;
    const courseId = await client.mutation(api.seedCourses.createCourse, courseArgs);
    console.log(`✅ Course ensured: ${courseData.title} (${courseId})`);

    // 2. Link Challenges
    // We need to fetch all challenges and check their category
    // Since we don't have a specific "updateChallengeCategory" mutation that takes a query,
    // we'll iterate locally or add a mutation.
    // Ideally, we'd have a mutation `linkChallengesToCourse(courseId, categories)`.

    // For now, let's just fetch all challenges and patch them one by one if they match.
    // This is a bit inefficient but fine for seeding.
    const allChallenges = await client.query(api.challenges.list);

    const matchingChallenges = allChallenges.filter((c) => categories.includes(c.category));

    if (matchingChallenges.length > 0) {
      console.log(`   Linking ${matchingChallenges.length} challenges to ${courseData.title}...`);

      for (const challenge of matchingChallenges) {
        // We can use the createChallenge mutation to update (it patches if exists)
        // But createChallenge requires ALL args.
        // Better to use a direct patch if we had one exposed, but we can assume we can define a simple action or just use internal logic if this was server-side.
        // Since we are client-side here (script), we need a mutation.

        // Re-using createChallenge is risky if we don't pass all fields.
        // Let's modify convex/seedCourses.ts to add a linker mutation?
        // Or just use `createChallenge` with the existing data + courseId.

        await client.mutation(api.seedCourses.createChallenge, {
          courseId: courseId,
          slug: challenge.slug,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          difficulty: challenge.difficulty,
          xpReward: challenge.xpReward,
          order: challenge.order,
          starterCode: challenge.starterCode
            ? {
                html: challenge.starterCode.html,
                css: challenge.starterCode.css,
                js: challenge.starterCode.js,
              }
            : undefined,
          validation: challenge.validation,
          hints: challenge.hints,
          type: challenge.type,
          theoryContent: challenge.theoryContent,
        });
      }
      console.log(`   Linked.`);
    }
  }

  console.log("🏁 Seeding complete.");
}

seed().catch(console.error);
