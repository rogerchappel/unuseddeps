/**
 * Cross-reference engine — compare declared dependencies against
 * actually-imported packages to find unused ones.
 */

import type { ParsedManifest } from "./parser.js";

export interface UnusedReport {
  /** Packages declared but never imported */
  unused: string[];
  /** Packages that ARE imported */
  used: string[];
  /** Total declared package count */
  totalDeclared: number;
  /** Scan info */
  scannedFiles: number;
  /** Packages explicitly ignored via --ignore */
  ignored: string[];
}

/**
 * Map @types/foo → foo for matching against imports.
 */
export function normalizePackageName(name: string): string {
  return name.startsWith("@types/") && name !== "@types"
    ? name.replace("@types/", "")
    : name;
}

/**
 * Compute unused dependencies given a manifest, set of imported packages,
 * and optional ignore patterns.
 */
export function findUnused(
  manifest: ParsedManifest,
  imports: Set<string>,
  options: {
    includeDev?: boolean;
    ignore?: string[];
    workspacePackages?: string[];
  } = {},
): UnusedReport {
  const { includeDev = true, ignore = [], workspacePackages = [] } = options;

  // Packages that CAN be "unused": deps + (if enabled) devDeps
  const checkable = new Set<string>(Object.keys(manifest.deps));
  if (includeDev) {
    for (const k of Object.keys(manifest.devDeps)) checkable.add(k);
  }

  // peerDeps and optDeps are NEVER flagged as unused (consumed by other packages)
  const neverFlagged = new Set([
    ...Object.keys(manifest.peerDeps),
    ...Object.keys(manifest.optDeps),
  ]);

  const matched: Set<string> = new Set();
  const ignoredPkgNames: string[] = [];

  for (const declared of checkable) {
    // Skip workspace packages
    if (workspacePackages.some((wp) => matchesPattern(declared, wp))) {
      ignoredPkgNames.push(declared);
      matched.add(declared); // treat ignored as "not unused"
      continue;
    }

    // Skip explicit ignores
    if (ignore.some((p) => matchesPattern(declared, p))) {
      ignoredPkgNames.push(declared);
      matched.add(declared); // treat ignored as "not unused"
      continue;
    }

    // Check direct match or @types alias match
    const normalized = normalizePackageName(declared);
    if (imports.has(declared) || imports.has(normalized)) {
      matched.add(declared);
    }
  }

  const unused = [...checkable].filter((p) => !matched.has(p)).sort();
  const usedSet = new Set<string>([...matched, ...neverFlagged]);
  const used = [...usedSet].sort();

  return {
    unused,
    used,
    totalDeclared: checkable.size,
    scannedFiles: 0,
    ignored: ignoredPkgNames.sort(),
  };
}

/** Simple glob matcher: * and ? */
function matchesPattern(name: string, pattern: string): boolean {
  if (pattern === "*") return true;
  if (!pattern.includes("*") && !pattern.includes("?")) {
    return name === pattern;
  }
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${regex}$`).test(name);
}
