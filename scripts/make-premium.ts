import { execSync } from "child_process";

const email = process.argv[2];

if (!email) {
    console.error("Usage: bun run db:premium <email>");
    process.exit(1);
}

console.log(`Setting ${email} to PREMIUM...`);

try {
    const args = JSON.stringify({ email });
    // Using convex run admin:makePremium
    execSync(`bunx convex run admin:makePremium '${args}'`, { stdio: "inherit" });
    console.log("Success!");
} catch (error) {
    console.error("Failed to set premium status. Make sure the user has logged in at least once so their email is synced.");
    process.exit(1);
}
