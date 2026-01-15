import { GoogleGenAI, FunctionCallingConfigMode, FunctionDeclaration } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const createAlgoCourse: FunctionDeclaration = {
  name: "createAlgoCourse",
  description:
    "Create the Algorithms & Data Structures course metadata and theory challenges with KaTeX math.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      course: {
        type: "object",
        properties: {
          title: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          icon: { type: "string" },
          order: { type: "number" },
        },
        required: ["title", "slug", "description", "icon", "order"],
      },
      challenges: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "number" },
            xpReward: { type: "number" },
            order: { type: "number" },
            type: { type: "string" },
            theoryContent: { type: "string" },
          },
          required: [
            "slug",
            "title",
            "description",
            "category",
            "difficulty",
            "xpReward",
            "order",
            "type",
            "theoryContent",
          ],
        },
      },
    },
    required: ["course", "challenges"],
  },
};

const prompt = `You are a CS professor. Create an "Algorithms & Data Structures" course with theory-only lessons.

Requirements:
- Output MUST be a call to the function createAlgoCourse.
- Create exactly 6 theory challenges, in this exact topic order:
  1) Big O (Time/Space)
  2) Sorting: Bubble Sort
  3) Sorting: Merge Sort
  4) Sorting: Quick Sort
  5) Trees: Binary Search Trees (BST)
  6) Graphs: BFS and DFS
- Each challenge must have type = "theory" and category = "Algorithms & Data Structures".
- Slugs must be unique, kebab-case.
- theoryContent must be detailed, instructor-style, and include extensive KaTeX math.
  Include at least 8 distinct KaTeX expressions per lesson, using both inline $...$ and block $$...$$.
- Use correct asymptotic notation, recurrences, and proofs/intuition.
- Keep description short (1-2 sentences) and reserve the full explanation for theoryContent.
- Provide reasonable difficulty (1-5) and xpReward (50-250) increasing with complexity.
- Ensure course metadata:
  title: "Algorithms & Data Structures"
  slug: "algorithms-data-structures"
  description: concise and inviting
  icon: "Binary"
  order: 10
`;

async function main() {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY,
          allowedFunctionNames: ["createAlgoCourse"],
        },
      },
      tools: [{ functionDeclarations: [createAlgoCourse] }],
    },
  });

  const call = response.functionCalls?.[0];
  if (!call || call.name !== "createAlgoCourse") {
    console.error("Model did not return the expected function call.");
    console.error(JSON.stringify(response, null, 2));
    process.exit(1);
  }

  const outputPath = path.join(process.cwd(), "scripts", "algo_course.json");
  fs.writeFileSync(outputPath, JSON.stringify(call.args, null, 2));

  console.log(`✅ Generated Algorithms course at ${outputPath}`);
}

main().catch((err) => {
  console.error("❌ Generation failed:", err);
  process.exit(1);
});
