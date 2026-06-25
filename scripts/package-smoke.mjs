import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["pack", "--dry-run"], {
  encoding: "utf8",
});

const output = `${result.stdout || ""}\n${result.stderr || ""}`;

if (result.status !== 0) {
  process.stderr.write(output);
  process.exit(result.status || 1);
}

const requiredEntries = [
  "dist/cli.js",
  "dist/index.js",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CHANGELOG.md",
];

const forbiddenEntries = [
  "src/cli.ts",
  "fixtures/all-clean/package.json",
  "coverage/",
];

const missing = requiredEntries.filter((entry) => !output.includes(entry));
const leaked = forbiddenEntries.filter((entry) => output.includes(entry));

if (missing.length > 0 || leaked.length > 0) {
  if (missing.length > 0) {
    console.error(`package smoke missing entries:\n${missing.join("\n")}`);
  }
  if (leaked.length > 0) {
    console.error(`package smoke unexpected entries:\n${leaked.join("\n")}`);
  }
  process.exit(1);
}

console.log("package smoke passed");
