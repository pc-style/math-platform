import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

type CourseArgs = {
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
};

type ChallengeArgs = {
  slug: string;
  courseId?: unknown;
  type?: "coding" | "theory";
  theoryContent?: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  xpReward: number;
  starterCode?: {
    html: string;
    css: string;
    js?: string;
  };
  validation?: {
    type: string;
    rules: Array<{
      selector: string;
      property: string;
      expected: string;
      hint: string;
    }>;
  };
  hints?: string[];
  order: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`Expected ${label} to be an object`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`Expected ${label} to be a string`);
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value))
    throw new Error(`Expected ${label} to be a number`);
  return value;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`Expected ${label} to be an array`);
  return value;
}

function pickCourseArgs(raw: unknown): CourseArgs {
  const course = requireRecord(raw, "course");
  return {
    title: requireString(course.title, "course.title"),
    slug: requireString(course.slug, "course.slug"),
    description: requireString(course.description, "course.description"),
    icon: requireString(course.icon, "course.icon"),
    order: requireNumber(course.order, "course.order"),
  };
}

function pickChallengeArgs(raw: unknown, index: number): ChallengeArgs {
  const challenge = requireRecord(raw, `challenges[${index}]`);

  const starterCodeRaw = challenge.starterCode;
  const starterCode =
    starterCodeRaw === undefined
      ? undefined
      : requireRecord(starterCodeRaw, `challenges[${index}].starterCode`);

  const validationRaw = challenge.validation;
  const validation =
    validationRaw === undefined
      ? undefined
      : requireRecord(validationRaw, `challenges[${index}].validation`);

  const validationRulesRaw = validation?.rules;
  const validationRules =
    validation === undefined
      ? undefined
      : requireArray(validationRulesRaw, `challenges[${index}].validation.rules`);

  const hintsRaw = challenge.hints;
  const hints =
    hintsRaw === undefined ? undefined : requireArray(hintsRaw, `challenges[${index}].hints`);

  const typeRaw = challenge.type;
  const type =
    typeRaw === undefined
      ? undefined
      : typeRaw === "coding" || typeRaw === "theory"
        ? typeRaw
        : (() => {
            throw new Error(`Expected challenges[${index}].type to be "coding" or "theory"`);
          })();

  return {
    slug: requireString(challenge.slug, `challenges[${index}].slug`),
    title: requireString(challenge.title, `challenges[${index}].title`),
    description: requireString(challenge.description, `challenges[${index}].description`),
    category: requireString(challenge.category, `challenges[${index}].category`),
    difficulty: requireNumber(challenge.difficulty, `challenges[${index}].difficulty`),
    xpReward: requireNumber(challenge.xpReward, `challenges[${index}].xpReward`),
    order: requireNumber(challenge.order, `challenges[${index}].order`),
    type,
    theoryContent:
      challenge.theoryContent === undefined
        ? undefined
        : requireString(challenge.theoryContent, `challenges[${index}].theoryContent`),
    starterCode:
      starterCode === undefined
        ? undefined
        : {
            html: requireString(starterCode.html, `challenges[${index}].starterCode.html`),
            css: requireString(starterCode.css, `challenges[${index}].starterCode.css`),
            js:
              starterCode.js === undefined
                ? undefined
                : requireString(starterCode.js, `challenges[${index}].starterCode.js`),
          },
    validation:
      validation === undefined
        ? undefined
        : {
            type: requireString(validation.type, `challenges[${index}].validation.type`),
            rules: validationRules!.map((rule, ruleIndex) => {
              const r = requireRecord(rule, `challenges[${index}].validation.rules[${ruleIndex}]`);
              return {
                selector: requireString(
                  r.selector,
                  `challenges[${index}].validation.rules[${ruleIndex}].selector`,
                ),
                property: requireString(
                  r.property,
                  `challenges[${index}].validation.rules[${ruleIndex}].property`,
                ),
                expected: requireString(
                  r.expected,
                  `challenges[${index}].validation.rules[${ruleIndex}].expected`,
                ),
                hint: requireString(
                  r.hint,
                  `challenges[${index}].validation.rules[${ruleIndex}].hint`,
                ),
              };
            }),
          },
    hints: hints?.map((h, hintIndex) =>
      requireString(h, `challenges[${index}].hints[${hintIndex}]`),
    ),
  };
}

function readConvexUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.CONVEX_URL ??
    process.env.CONVEX_DEPLOYMENT_URL ??
    process.env.CONVEX_HTTP_URL;

  if (!url) {
    throw new Error(
      "Missing Convex URL. Set NEXT_PUBLIC_CONVEX_URL (or CONVEX_URL / CONVEX_DEPLOYMENT_URL / CONVEX_HTTP_URL).",
    );
  }
  return url;
}

async function main() {
  const jsonPathArg = process.argv[2];
  if (!jsonPathArg) {
    console.error("Usage: bun scripts/seed-json-course.ts <path-to-course.json>");
    process.exitCode = 1;
    return;
  }

  const jsonPath = resolve(process.cwd(), jsonPathArg);
  const rawText = await readFile(jsonPath, "utf8");
  const parsed: unknown = JSON.parse(rawText);

  const root = requireRecord(parsed, "JSON root");

  const courseArgs = pickCourseArgs(root.course);
  const challengesRaw = requireArray(root.challenges, "challenges");
  const challengesArgs = challengesRaw.map((c, i) => pickChallengeArgs(c, i));

  const client = new ConvexHttpClient(readConvexUrl());

  console.log(`Seeding course: ${courseArgs.title} (${courseArgs.slug})`);
  const courseId = await client.mutation(api.seedCourses.createCourse, courseArgs);
  console.log(`Course ensured: ${courseId}`);

  for (const [index, challenge] of challengesArgs.entries()) {
    console.log(`Seeding challenge ${index + 1}/${challengesArgs.length}: ${challenge.slug}`);
    await client.mutation(api.seedCourses.createChallenge, { ...challenge, courseId });
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
