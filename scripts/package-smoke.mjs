import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  encoding: "utf8",
});

if (result.status !== 0) {
  process.stderr.write(result.stderr);
  process.exit(result.status || 1);
}

const [packument] = JSON.parse(result.stdout);
const packedFiles = new Set(packument.files.map((file) => file.path));

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

const missing = requiredEntries.filter((entry) => !packedFiles.has(entry));
const leaked = forbiddenEntries.filter((entry) =>
  [...packedFiles].some((file) => file === entry || file.startsWith(entry))
);

if (missing.length > 0 || leaked.length > 0) {
  if (missing.length > 0) {
    console.error(`package smoke missing entries:\n${missing.join("\n")}`);
  }
  if (leaked.length > 0) {
    console.error(`package smoke unexpected entries:\n${leaked.join("\n")}`);
  }
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const binPath = packageJson.bin?.unuseddeps;
const binEntry = packument.files.find((file) => file.path === binPath);

if (!binPath || !binEntry) {
  console.error("package smoke missing unuseddeps bin entry");
  process.exit(1);
}

if ((binEntry.mode & 0o111) === 0) {
  console.error("package smoke found a non-executable unuseddeps bin");
  process.exit(1);
}

if (!readFileSync(binPath, "utf8").startsWith("#!/usr/bin/env node")) {
  console.error("package smoke found unuseddeps bin without a Node shebang");
  process.exit(1);
}

console.log(`package smoke passed with ${packument.files.length} packed file(s)`);
