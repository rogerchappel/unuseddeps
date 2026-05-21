#!/usr/bin/env node
/**
 * unuseddeps CLI — entry point
 *
 * Usage:
 *   unuseddeps [dir]
 *   unuseddeps . --ignore "eslint*" --format json
 */

import { Command } from "commander";
import pc from "picocolors";
import { glob } from "glob";
import { readFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseManifest, getAllDeclared } from "./parser.js";
import { scanFiles, FILE_EXTENSIONS } from "./scanner.js";
import { findUnused } from "./referencer.js";
import { formatReport, exitCode, type ReporterOptions } from "./reporter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VERSION = (
  JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")) as { version: string }
).version;

const IGNORE_DEFAULT = ["node_modules", "dist", "build", "coverage", "**/*.d.ts", "**/vite.config.*", "**/vitest.config.*"];

const program = new Command();

program
  .name("unuseddeps")
  .description("Detect unused Node.js dependencies in your project")
  .version(VERSION)
  .argument("[dir]", "Directory to scan", ".")
  .option("-i, --ignore <patterns...>", "Ignore packages matching glob patterns (repeatable)")
  .option("-f, --format <format>", "Output format: text (default) or json", "text")
  .option("--include-dev", "Include devDependencies in the check", true)
  .option("--no-include-dev", "Exclude devDependencies from the check")
  .option("--no-color", "Disable colored output")
  .option("--scan-pattern <patterns...>", "Additional glob patterns for files to scan")
  .addHelpText(
    "after",
    `\n${pc.bold("Examples:")}
  ${pc.cyan("unuseddeps                     # scan current directory")}
  ${pc.cyan("unuseddeps ./my-project        # scan a specific directory")}
  ${pc.cyan('unuseddeps --ignore "eslint*"  # ignore eslint packages')}
  ${pc.cyan("unuseddeps --format json       # output JSON")}
  ${pc.cyan("unuseddeps --no-include-dev    # skip devDependency checks")}
  ${pc.cyan("unuseddeps --no-color          # plain text, no ANSI")}
`,
  );

program.parse(process.argv);

const opts = program.opts();
const targetDir = resolve(program.args[0] || ".");

// Validate options
if (!["text", "json"].includes(opts.format)) {
  process.stderr.write(pc.red(`Error: unknown format "${opts.format}". Use "text" or "json".\n`));
  process.exit(2);
}

// Read package.json
const pkgPath = join(targetDir, "package.json");
let pkgContent: string;
try {
  pkgContent = readFileSync(pkgPath, "utf-8");
} catch {
  process.stderr.write(pc.red(`Error: cannot read ${pkgPath}\n`));
  process.exit(1);
}

const manifest = parseManifest(pkgContent);
const allDeclared = getAllDeclared(manifest);

if (allDeclared.size === 0) {
  process.stderr.write(pc.yellow("Warning: no dependencies found in package.json\n"));
  const emptyReport = {
    unused: [], used: [], totalDeclared: 0, scannedFiles: 0, ignored: [],
  };
  console.log(formatReport(emptyReport, { format: opts.format, noColor: opts.noColor }));
  process.exit(0);
}

// Collect files to scan
const extGlobs = [...FILE_EXTENSIONS].map((ext) => `**/*${ext}`);
const scanPatterns = opts.scanPattern ? [...extGlobs, ...opts.scanPattern] : extGlobs;
const excludePatterns = IGNORE_DEFAULT;

let scannedFiles: string[];
try {
  scannedFiles = glob.sync(scanPatterns, {
    cwd: targetDir,
    nodir: true,
    ignore: excludePatterns,
    absolute: true,
    dot: false,
  });
} catch (err) {
  process.stderr.write(pc.red(`Error: failed to glob files: ${(err as Error).message}\n`));
  process.exit(1);
}

if (scannedFiles.length === 0) {
  console.error(pc.yellow(`Warning: no source files found in ${targetDir}`));
}

// Scan imports
const { imports } = scanFiles(scannedFiles);

// Cross-reference
const report = findUnused(manifest, imports, {
  includeDev: opts.includeDev !== false,
  ignore: opts.ignore || [],
  workspacePackages: [...Object.values(manifest.deps), ...Object.values(manifest.devDeps)]
    .filter((v: string) => v.startsWith("file:") || v.startsWith("link:") || v.startsWith("workspace:"))
    .map((v: string) => v.replace(/^(file:|link:|workspace:)/, "")),
});

// Attach scanned file count
report.scannedFiles = scannedFiles.length;

// Format and print
const options: ReporterOptions = {
  format: opts.format,
  noColor: opts.noColor,
};

const output = formatReport(report, options);

if (report.unused.length > 0) {
  process.stderr.write(output + "\n");
} else {
  process.stdout.write(output + "\n");
}

process.exit(exitCode(report));
