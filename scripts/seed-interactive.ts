import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const challenges = [
  {
    slug: "sorting-visualizer",
    title: "Sorting Algorithms Visualizer",
    description: "Interactive visualizer for bubble sort, merge sort, and more.",
    category: "Interactive",
    difficulty: 3,
    xpReward: 300,
    starterCode: { html: "", css: "", js: "" },
    validation: { type: "interactive", rules: [] },
    hints: [],
    order: 100,
  },
  {
    slug: "box-model-playground",
    title: "Box Model Playground",
    description: "Experiment with margin, border, and padding in real-time.",
    category: "Interactive",
    difficulty: 2,
    xpReward: 200,
    starterCode: { html: "", css: "", js: "" },
    validation: { type: "interactive", rules: [] },
    hints: [],
    order: 101,
  },
];

async function seed() {
  console.log("Seeding interactive challenges...");
  await client.mutation(api.challenges.insertBatch, { challenges });
  console.log("Done!");
}

seed().catch(console.error);
