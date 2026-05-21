/**
 * Import scanner — statically extract top-level module names from
 * .ts, .tsx, .js, .jsx, .mjs, .cjs source files.
 *
 * Handles:
 *   - ES imports: import x from 'pkg', import { x } from 'pkg', import 'pkg'
 *   - CommonJS: require('pkg'), require('pkg/sub')
 *   - Dynamic imports: await import('pkg'), import('pkg')
 *   - Re-exports: export { x } from 'pkg', export * from 'pkg'
 */

/**
 * Extract the top-level segment of a module specifier.
 *   "lodash" → "lodash"
 *   "@types/node" → "@types/node"
 *   "lodash/fp" → "lodash"
 *   "@babel/core" → "@babel/core"
 *   "./local" → null (relative)
 *   "node:fs" → null (built-in node scheme)
 */
function topLevelPackage(specifier: string): string | null {
  // Skip relative / absolute / url / node-builtin imports
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
    specifier.startsWith("node:") ||
    specifier.startsWith("http://") ||
    specifier.startsWith("https://")
  ) {
    return null;
  }
  // Scoped packages: @scope/name
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return null;
  }
  // Regular packages
  return specifier.split("/")[0] || null;
}

/**
 * Scan a single file string and return unique top-level package names.
 */
export function scanFileSource(content: string): Set<string> {
  const results = new Set<string>();

  // Pattern 1: import ... from 'pkg'
  for (const m of content.matchAll(
    /import\s+(?:type\s+)?[\s\S]*?\s+from\s+['"](.*?)['"]/g,
  )) {
    const top = topLevelPackage(m[1]);
    if (top) results.add(top);
  }

  // Pattern 2: side-effect imports: import 'pkg'
  for (const m of content.matchAll(/^import\s+['"](.*?)['"];?\s*$/gm)) {
    const top = topLevelPackage(m[1]);
    if (top) results.add(top);
  }

  // Pattern 3: require('pkg')  /  require("pkg")
  for (const m of content.matchAll(
    /(?:^|[\s(])require\s*\(\s*['"](.*?)['"]\s*\)/gm,
  )) {
    const top = topLevelPackage(m[1]);
    if (top) results.add(top);
  }

  // Pattern 4: dynamic import: import('pkg')
  for (const m of content.matchAll(
    /import\s*\(\s*['"](.*?)['"]\s*\)/gm,
  )) {
    const top = topLevelPackage(m[1]);
    if (top) results.add(top);
  }

  // Pattern 5: export ... from 'pkg'
  for (const m of content.matchAll(
    /export\s+[\s\S]*?\s+from\s+['"](.*?)['"]/g,
  )) {
    const top = topLevelPackage(m[1]);
    if (top) results.add(top);
  }

  return results;
}

export const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

/**
 * Scan a list of file paths (absolute or relative), read them, and
 * aggregate all imported top-level package names with per-file provenance.
 *
 * Returns: Map<pkgName, Set<filePath>>
 */
export interface ScanResult {
  /** Set of all imported top-level package names */
  imports: Set<string>;
  /** Map of package → set of files that import it */
  origins: Map<string, Set<string>>;
}

/**
 * Synchronous file scanning (for simplicity; vitest runs in node).
 * `files` is an array of absolute file paths.
 */
import { readFileSync } from "node:fs";

export function scanFiles(files: string[]): ScanResult {
  const allImports = new Set<string>();
  const origins = new Map<string, Set<string>>();

  for (const file of files) {
    const ext = file.slice(file.lastIndexOf(".")) || "";
    if (!FILE_EXTENSIONS.has(ext)) continue;
    let content: string;
    try {
      content = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const fileImports = scanFileSource(content);
    for (const pkg of fileImports) {
      allImports.add(pkg);
      if (!origins.has(pkg)) origins.set(pkg, new Set());
      origins.get(pkg)!.add(file);
    }
  }

  return { imports: allImports, origins };
}
