/**
 * Reporter — format and print unused dependency reports.
 * Supports text (default), JSON, and colored output.
 */

import type { UnusedReport } from "./referencer.js";
import pc from "picocolors";

export interface ReporterOptions {
  format: "text" | "json";
  noColor?: boolean;
}

/**
 * Format the report and return as a string.
 */
export function formatReport(
  report: UnusedReport,
  options: ReporterOptions = { format: "text" },
): string {
  if (options.format === "json") {
    return formatJson(report);
  }
  return formatText(report, options.noColor ?? false);
}

function formatJson(report: UnusedReport): string {
  return JSON.stringify(
    {
      unused: report.unused,
      used: report.used,
      totalDeclared: report.totalDeclared,
      scannedFiles: report.scannedFiles,
      ignored: report.ignored,
      summary: getSummary(report),
    },
    null,
    2,
  );
}

function formatText(report: UnusedReport, noColor: boolean): string {
  const lines: string[] = [];
  const bold = (s: string) => (noColor ? `**${s}**` : pc.bold(s));
  const green = (s: string) => (noColor ? s : pc.green(s));
  const red = (s: string) => (noColor ? s : pc.red(s));
  const yellow = (s: string) => (noColor ? s : pc.yellow(s));
  const dim = (s: string) => (noColor ? s : pc.dim(s));

  lines.push(bold("🧭 unuseddeps"));
  lines.push(dim("Detect unused dependencies in Node.js projects\n"));

  // Summary line
  const summary = getSummary(report);
  if (report.unused.length === 0) {
    lines.push(green(`✓ ${summary}`));
  } else {
    lines.push(red(`✗ Found ${report.unused.length} unused ${plural(report.unused.length, "dependency", "dependencies")} (${report.used.length} used of ${report.totalDeclared} total)\n`));
    lines.push(bold("Unused:"));
    for (const pkg of report.unused) {
      lines.push(`  ${red("●")} ${pkg}`);
    }
  }

  // Ignored section
  if (report.ignored.length > 0) {
    lines.push(`\n${yellow("Ignored:")} ${report.ignored.join(", ")}`);
  }

  lines.push(dim(`\nScanned ${report.scannedFiles} ${plural(report.scannedFiles, "file", "files")}`));

  return lines.join("\n");
}

function getSummary(report: UnusedReport): string {
  if (report.unused.length === 0) {
    return `Clean (${report.used.length}/${report.totalDeclared})`;
  }
  return `${report.unused.length} unused of ${report.totalDeclared} total`;
}

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/**
 * Get the appropriate exit code.
 * 0 = no unused deps, 1 = unused deps found.
 */
export function exitCode(report: UnusedReport): number {
  return report.unused.length > 0 ? 1 : 0;
}
