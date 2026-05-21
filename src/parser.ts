/**
 * Package.json parser — extracts dependencies, devDependencies,
 * optionalDependencies, and peerDependencies.
 */

export interface ParsedManifest {
  /** All declared dependencies { name: version } */
  deps: Record<string, string>;
  /** All declared devDependencies { name: version } */
  devDeps: Record<string, string>;
  /** peerDependencies — NOT flagged as unused (user of this lib) */
  peerDeps: Record<string, string>;
  /** optionalDependencies */
  optDeps: Record<string, string>;
}

/**
 * Parse a package.json string into structured dependency maps.
 */
export function parseManifest(json: string): ParsedManifest {
  const parsed = JSON.parse(json);
  return {
    deps: parsed.dependencies ?? {},
    devDeps: parsed.devDependencies ?? {},
    peerDeps: parsed.peerDependencies ?? {},
    optDeps: parsed.optionalDependencies ?? {},
  };
}

/**
 * Returns a set of package names that should NOT be flagged as unused.
 * Combines deps + peerDeps + optDeps (these are consumed by others).
 * Dev deps are only included when `includeDev` is true.
 */
export function getNonFlagSet(
  parsed: ParsedManifest,
  includeDev = true,
): Set<string> {
  const set = new Set<string>(Object.keys(parsed.deps));
  union(set, Object.keys(parsed.optDeps));
  // peerDeps: never flag (other packages need them)
  union(set, Object.keys(parsed.peerDeps));
  if (includeDev) {
    union(set, Object.keys(parsed.devDeps));
  }
  return set;
}

/**
 * Returns ALL declared package names (deps + devDeps + peer + opt).
 */
export function getAllDeclared(parsed: ParsedManifest): Set<string> {
  return new Set([
    ...Object.keys(parsed.deps),
    ...Object.keys(parsed.devDeps),
    ...Object.keys(parsed.peerDeps),
    ...Object.keys(parsed.optDeps),
  ]);
}

function union(a: Set<string>, b: Iterable<string>): Set<string> {
  for (const x of b) a.add(x);
  return a;
}
