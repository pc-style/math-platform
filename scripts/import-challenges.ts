import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function importChallenges() {
  const tmpDir = "/Users/pcstyle/.gemini/tmp";
  const files = fs
    .readdirSync(tmpDir)
    .filter((f) => f.startsWith("challenges_") && f.endsWith(".json"));

  console.log(`Found ${files.length} challenge files to import.`);

  for (const file of files) {
    const filePath = path.join(tmpDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    try {
      // Sanitize: find first '[' and last ']'
      const start = content.indexOf("[");
      const end = content.lastIndexOf("]");
      if (start === -1 || end === -1) {
        throw new Error("No JSON array found");
      }
      const jsonStr = content.substring(start, end + 1);

      const rawChallenges = JSON.parse(jsonStr);

      // Normalize: ensure optional fields exist
      const challenges = rawChallenges.map((c: any) => ({
        ...c,
        starterCode: {
          ...c.starterCode,
          js: c.starterCode.js || "",
        },
      }));

      console.log(`Importing ${challenges.length} challenges from ${file}...`);

      await client.mutation(api.challenges.insertBatch, { challenges });

      console.log(`✅ Successfully imported ${file}`);
    } catch (error) {
      console.error(`❌ Failed to import ${file}:`, error);
    }
  }
}

importChallenges().catch(console.error);
