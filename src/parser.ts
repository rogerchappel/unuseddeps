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

type DependencySection =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "optionalDependencies";

function parseDependencySection(
  manifest: Record<string, unknown>,
  section: DependencySection,
): Record<string, string> {
  const value = manifest[section];
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(
      `Invalid package.json: "${section}" must be an object of string ranges`,
    );
  }

  const dependencies: Record<string, string> = {};
  for (const [name, range] of Object.entries(value)) {
    if (typeof range !== "string") {
      throw new Error(
        `Invalid package.json: "${section}.${name}" must be a string range`,
      );
    }
    dependencies[name] = range;
  }
  return dependencies;
}

/**
 * Parse a package.json string into structured dependency maps.
 */
export function parseManifest(json: string): ParsedManifest {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid package.json: malformed JSON");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid package.json: root must be an object");
  }

  const manifest = parsed as Record<string, unknown>;
  return {
    deps: parseDependencySection(manifest, "dependencies"),
    devDeps: parseDependencySection(manifest, "devDependencies"),
    peerDeps: parseDependencySection(manifest, "peerDependencies"),
    optDeps: parseDependencySection(manifest, "optionalDependencies"),
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
