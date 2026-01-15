import { GoogleGenAI } from "@google/genai";
import { execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY or GOOGLE_API_KEY is not set.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const COURSE = {
  title: "Python Mastery",
  slug: "python-mastery",
  description: "Become fluent in Python fundamentals, paradigms, and async patterns.",
  icon: "Terminal",
  order: 1,
  modules: ["Basics", "Data Structures", "OOP", "Functional Programming", "Async"],
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function getResponseText(response: unknown): string {
  if (response && typeof response === "object") {
    const maybeText = (response as { text?: unknown }).text;
    if (typeof maybeText === "function") {
      return (maybeText as () => string)();
    }
    if (typeof maybeText === "string") {
      return maybeText;
    }
  }
  return JSON.stringify(response ?? "");
}

function extractJson(rawText: string): string | null {
  const cleaned = rawText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function generateLesson(courseId: string, moduleName: string, order: number) {
  const moduleSlug = slugify(moduleName);
  const prompt = `
Create a "Brilliant.org"-style Python lesson for the module: "${moduleName}" within the course "${COURSE.title}".

Return ONLY valid JSON with this structure:
{
  "slug": "${COURSE.slug}-${moduleSlug}",
  "title": "<engaging title>",
  "type": "theory",
  "description": "Short summary",
  "content": "Markdown lesson content. Use Python code blocks and concrete examples.",
  "xpReward": 150,
  "hints": ["hint1", "hint2", "hint3"]
}

Guidelines:
- Keep it concise but rich: explanation + 1-2 example snippets.
- Use Markdown headings and bullet points.
- Do NOT include backticks that break JSON escaping.
- Do NOT include any extra text outside JSON.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = getResponseText(response);
  const jsonStr = extractJson(text);
  if (!jsonStr) {
    throw new Error("Failed to parse JSON from model response.");
  }

  const lessonData = JSON.parse(jsonStr);
  const challengeArgs = {
    slug: lessonData.slug,
    courseId,
    type: "theory",
    theoryContent: lessonData.content,
    title: lessonData.title,
    description: lessonData.description,
    category: COURSE.title,
    difficulty: 1,
    xpReward: lessonData.xpReward ?? 150,
    hints: lessonData.hints,
    order,
  };

  const safeChallengeArgs = JSON.stringify(challengeArgs).replace(/'/g, "'\\''");
  execSync(`bunx convex run seedCourses:createChallenge '${safeChallengeArgs}'`, {
    stdio: "inherit",
  });

  console.log(`    Lesson "${lessonData.title}" created.`);
}

async function main() {
  console.log(`Generating content for course: ${COURSE.title}...`);

  const courseArgs = JSON.stringify({
    title: COURSE.title,
    slug: COURSE.slug,
    description: COURSE.description,
    icon: COURSE.icon,
    order: COURSE.order,
  });
  const safeCourseArgs = courseArgs.replace(/'/g, "'\\''");
  const output = execSync(`bunx convex run seedCourses:createCourse '${safeCourseArgs}'`, {
    encoding: "utf-8",
  });
  const courseId = output.trim().replace(/^"|"$/g, "");

  console.log(`Course created/found: ${courseId}`);

  let order = 1;
  for (const moduleName of COURSE.modules) {
    console.log(`  Generating lesson for module: ${moduleName}...`);
    try {
      await generateLesson(courseId, moduleName, order++);
    } catch (error) {
      console.error(`    Error generating/saving lesson for ${moduleName}:`, error);
    }
  }

  console.log("Python course generation complete!");
}

main().catch((error) => {
  console.error("Fatal error while generating Python course:", error);
  process.exit(1);
});
