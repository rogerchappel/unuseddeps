/**
 * unuseddeps — public API
 *
 * For programmatic use:
 *   import { detectUnused } from 'unuseddeps';
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { glob } from 'glob';
import { parseManifest } from './parser.js';
import { scanFiles, FILE_EXTENSIONS } from './scanner.js';
import { findUnused, type UnusedReport } from './referencer.js';
import { formatReport, exitCode } from './reporter.js';

export { parseManifest, getNonFlagSet, getAllDeclared } from './parser.js';
export { scanFileSource, scanFiles, FILE_EXTENSIONS } from './scanner.js';
export { findUnused, normalizePackageName } from './referencer.js';
export { formatReport, exitCode } from './reporter.js';

// Re-export convenience wrapper
export const formatUnusedReport = formatReport;
export const getUnusedExitCode = exitCode;

export interface DetectOptions {
  /** Include devDependencies (default: true) */
  includeDev?: boolean;
  /** Package-name glob patterns to ignore */
  ignore?: string[];
  /** Custom glob patterns for source files */
  scanPatterns?: string[];
  /** Patterns to exclude from scan */
  exclude?: string[];
}

/**
 * Convenience: run the full pipeline on a directory.
 * Reads package.json, scans source, cross-references, returns report.
 */
export function detectUnused(dir: string, options: DetectOptions = {}): UnusedReport {
  const { includeDev = true, ignore = [], scanPatterns, exclude = [] } = options;

  const pkgPath = join(dir, 'package.json');
  const pkgContent = readFileSync(pkgPath, 'utf-8');
  const manifest = parseManifest(pkgContent);

  const patterns = scanPatterns ?? [...FILE_EXTENSIONS].map((e) => `**/*${e}`);
  const files = glob.sync(patterns, {
    cwd: dir,
    nodir: true,
    absolute: true,
    ignore: ['node_modules', 'dist', 'build', 'coverage', ...exclude],
    dot: false,
  });

  const { imports } = scanFiles(files);

  const report = findUnused(manifest, imports, {
    includeDev,
    ignore,
    workspacePackages: [
      ...Object.values(manifest.deps),
      ...Object.values(manifest.devDeps),
    ]
      .filter((v: string) => v.startsWith('file:') || v.startsWith('link:') || v.startsWith('workspace:'))
      .map((v: string) => v.replace(/^(file:|link:|workspace:)/, '')),
  });

  report.scannedFiles = files.length;
  return report;
}
