/**
 * Import scanner — statically extract top-level module names from
 * source files selected by the caller. FILE_EXTENSIONS defines the default
 * discovery set, while explicit custom patterns may select other extensions.
 *
 * Handles:
 *   - ES imports: import x from 'pkg', import { x } from 'pkg', import 'pkg'
 *   - CommonJS: require('pkg'), require('pkg/sub')
 *   - CommonJS resolution: require.resolve('pkg'), require.resolve('pkg/sub')
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
 *   "node:fs" → "@types/node" (Node.js built-in)
 *   "fs/promises" → "@types/node" (bare Node.js built-in)
 */
import { builtinModules } from "node:module";

const NODE_BUILTINS = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));

function topLevelPackage(specifier: string): string | null {
  const bareSpecifier = specifier.replace(/^node:/, "");
  if (specifier.startsWith("node:") || NODE_BUILTINS.has(bareSpecifier)) {
    return "@types/node";
  }

  // Skip relative / absolute / url imports
  if (
    specifier.startsWith(".") ||
    specifier.startsWith("/") ||
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

interface SourceToken {
  kind: "identifier" | "number" | "string" | "punctuation";
  value: string;
}

/**
 * Tokenize only the source elements needed to recognize module references.
 * Comments, regex literals, and template literal text are discarded. Template
 * substitutions are tokenized because they contain executable source.
 */
function tokenizeSource(content: string): SourceToken[] {
  const tokens: SourceToken[] = [];
  let index = 0;

  function tokenizeRange(stopAtClosingBrace = false): void {
    let braceDepth = 0;

    while (index < content.length) {
      const character = content[index];

      if (/\s/.test(character)) {
        index += 1;
        continue;
      }

      if (character === "/" && content[index + 1] === "/") {
        index += 2;
        while (index < content.length && content[index] !== "\n") index += 1;
        continue;
      }

      if (character === "/" && content[index + 1] === "*") {
        index += 2;
        while (index < content.length && !(content[index] === "*" && content[index + 1] === "/")) {
          index += 1;
        }
        index += 2;
        continue;
      }

      if (character === "/" && canStartRegexLiteral(tokens)) {
        index += 1;
        let inCharacterClass = false;
        while (index < content.length) {
          if (content[index] === "\\") {
            index += 2;
          } else if (content[index] === "[") {
            inCharacterClass = true;
            index += 1;
          } else if (content[index] === "]") {
            inCharacterClass = false;
            index += 1;
          } else if (content[index] === "/" && !inCharacterClass) {
            index += 1;
            while (index < content.length && /[A-Za-z]/.test(content[index])) index += 1;
            break;
          } else if (content[index] === "\n" || content[index] === "\r") {
            break;
          } else {
            index += 1;
          }
        }
        continue;
      }

      if (character === "`") {
        let value = "";
        let hasSubstitution = false;
        index += 1;
        while (index < content.length) {
          if (content[index] === "\\") {
            value += content[index] + (content[index + 1] ?? "");
            index += 2;
          } else if (content[index] === "$" && content[index + 1] === "{") {
            hasSubstitution = true;
            index += 2;
            tokens.push({ kind: "punctuation", value: "`" });
            tokenizeRange(true);
            tokens.push({ kind: "punctuation", value: "`" });
          } else if (content[index] === "`") {
            index += 1;
            break;
          } else {
            value += content[index];
            index += 1;
          }
        }
        if (!hasSubstitution) tokens.push({ kind: "string", value });
        continue;
      }

      if (character === "}" && stopAtClosingBrace && braceDepth === 0) {
        index += 1;
        return;
      }

      if (character === "'" || character === '"') {
        const quote = character;
        let value = "";
        index += 1;
        while (index < content.length && content[index] !== quote) {
          if (content[index] === "\\" && index + 1 < content.length) {
            value += content[index] + content[index + 1];
            index += 2;
          } else {
            value += content[index];
            index += 1;
          }
        }
        if (content[index] === quote) index += 1;
        tokens.push({ kind: "string", value });
        continue;
      }

      if (/[A-Za-z_$]/.test(character)) {
        const start = index;
        index += 1;
        while (index < content.length && /[A-Za-z0-9_$]/.test(content[index])) {
          index += 1;
        }
        tokens.push({ kind: "identifier", value: content.slice(start, index) });
        continue;
      }

      if (/[0-9]/.test(character)) {
        const start = index;
        index += 1;
        while (index < content.length && /[A-Za-z0-9_.]/.test(content[index])) index += 1;
        tokens.push({ kind: "number", value: content.slice(start, index) });
        continue;
      }

      if (stopAtClosingBrace && character === "{") braceDepth += 1;
      if (stopAtClosingBrace && character === "}") braceDepth -= 1;
      tokens.push({ kind: "punctuation", value: character });
      index += 1;
    }
  }

  tokenizeRange();
  return tokens;
}

function canStartRegexLiteral(tokens: SourceToken[]): boolean {
  const previous = tokens.at(-1);
  if (!previous) return true;

  if (previous.kind === "punctuation") {
    return [
      "(",
      "[",
      "{",
      ",",
      ";",
      ":",
      "=",
      "!",
      "?",
      "~",
      "+",
      "-",
      "*",
      "%",
      "&",
      "|",
      "^",
      "<",
      ">",
    ].includes(previous.value);
  }

  return [
    "await",
    "case",
    "delete",
    "do",
    "else",
    "in",
    "instanceof",
    "new",
    "of",
    "return",
    "throw",
    "typeof",
    "void",
    "yield",
  ].includes(previous.value);
}

function addPackage(results: Set<string>, token: SourceToken | undefined): void {
  if (token?.kind !== "string") return;
  const top = topLevelPackage(token.value);
  if (top) results.add(top);
}

function staticCallSpecifier(tokens: SourceToken[], openParenIndex: number): SourceToken | undefined {
  const specifier = tokens[openParenIndex + 1];
  if (specifier?.kind !== "string") return undefined;

  const separator = tokens[openParenIndex + 2];
  if (separator?.value === ")") return specifier;
  if (separator?.value !== "," || tokens[openParenIndex + 3]?.value === ")") return undefined;

  let depth = 1;
  for (let index = openParenIndex + 3; index < tokens.length; index += 1) {
    const value = tokens[index].value;
    if (value === "(" || value === "[" || value === "{") depth += 1;
    if (value === ")" || value === "]" || value === "}") depth -= 1;
    if (depth === 0) return value === ")" ? specifier : undefined;
  }

  return undefined;
}

/**
 * Scan a single file string and return unique top-level package names.
 */
export function scanFileSource(content: string): Set<string> {
  const results = new Set<string>();
  const tokens = tokenizeSource(content);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (
      token.value === "require" &&
      tokens[index - 1]?.value !== "." &&
      tokens[index + 1]?.value === "(" &&
      tokens[index + 3]?.value === ")"
    ) {
      addPackage(results, tokens[index + 2]);
      continue;
    }

    if (
      token.value === "require" &&
      tokens[index - 1]?.value !== "." &&
      tokens[index + 1]?.value === "." &&
      tokens[index + 2]?.value === "resolve" &&
      tokens[index + 3]?.value === "("
    ) {
      addPackage(results, staticCallSpecifier(tokens, index + 3));
      continue;
    }

    if (token.value !== "import" && token.value !== "export") continue;

    if (token.value === "import" && tokens[index + 1]?.value === "(") {
      addPackage(results, staticCallSpecifier(tokens, index + 1));
      continue;
    }

    if (token.value === "import" && tokens[index + 1]?.kind === "string") {
      addPackage(results, tokens[index + 1]);
      continue;
    }

    for (let lookahead = index + 1; lookahead < tokens.length; lookahead += 1) {
      if (tokens[lookahead].value === ";") break;
      if (tokens[lookahead].value === "from") {
        addPackage(results, tokens[lookahead + 1]);
        break;
      }
    }
  }

  return results;
}

export const FILE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);

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
