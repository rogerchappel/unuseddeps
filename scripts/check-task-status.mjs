import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const taskPath = path.join(root, "docs", "TASKS.md");
const taskStatus = await readFile(taskPath, "utf8");

for (const heading of ["## Current", "## Next"]) {
  if (!taskStatus.includes(heading)) {
    throw new Error(`docs/TASKS.md is missing ${heading}`);
  }
}

const staleClaims = [
  "set up package.json",
  "create src/index.ts",
  "implement package.json parser",
  "write unit tests for parser",
  "main command: scan directory",
  "flags: --ignore, --format, --include-dev, --base-dir",
];

const normalized = taskStatus.toLowerCase();
for (const claim of staleClaims) {
  if (normalized.includes(`- [ ] ${claim}`)) {
    throw new Error(`docs/TASKS.md lists implemented behavior as pending: ${claim}`);
  }
}

const evidenceLinks = [
  "../package.json",
  "../src/cli.ts",
  "../src/parser.ts",
  "../src/scanner.ts",
  "../src/referencer.ts",
  "../src/reporter.ts",
  "../fixtures/",
  "../README.md",
  "../CONTRIBUTING.md",
];

for (const reference of evidenceLinks) {
  if (!taskStatus.includes(`](${reference})`)) {
    throw new Error(`docs/TASKS.md is missing required evidence link: ${reference}`);
  }
  await access(path.resolve(path.dirname(taskPath), reference));
}

console.log("Task status documentation matches implemented repository capabilities.");
