<p align="center">
  🧭 <strong>unuseddeps</strong>
</p>

<p align="center">
  Detect unused Node.js dependencies — zero config, local-first, CI-friendly.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/unuseddeps"><img src="https://img.shields.io/npm/v/unuseddeps.svg?style=flat" alt="npm version"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/node/v/unuseddeps.svg?style=flat" alt="Node.js version"></a>
  <a href="https://github.com/rogerchappel/unuseddeps/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/rogerchappel/unuseddeps/ci.yml?style=flat" alt="CI status"></a>
  <img src="https://img.shields.io/badge/coverage-95%25-brightgreen.svg?style=flat" alt="Coverage">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat" alt="License"></a>
</p>

---

## The problem

You're three months into a project. You've tried Express, hapi, Fastify, and Koa — and settled on Koa. But your `package.json` still installs all four. Nobody remembers to clean up. `npm prune` won't help — it only removes packages in `node_modules` that _aren't_ in `package.json`.

**The stale packages that _are_ in `package.json`?** They stay. Forever. 🪦

## The solution

`unuseddeps` scans your source tree for `import` / `require()` / `import()` / `export from` statements, cross-references against `package.json`, and tells you exactly which declared dependencies are never imported.

Zero config. No opinionated project structure. Works offline. Exit code non-zero when unused deps found — perfect for CI.

```bash
$ unuseddeps
🧭 unuseddeps
Detect unused dependencies in Node.js projects

✗ Found 3 unused dependencies (2 used of 5 total)

Unused:
  ● axios
  ● chalk
  ● moment

Scanned 14 files
```

## Quick start

```bash
# Install (recommended: global CLI)
npm install -g unuseddeps

# Run in your project directory
unuseddeps

# Check in CI (fails on unused dependencies)
unuseddeps --format json | jq '.unused | length'
```

That's it. No config file needed.

## Features

- ⚡ **Zero config** — just run it. Reads `package.json`, scans your source, done.
- 🎯 **Accurate** — static analysis finds all `import` / `require()` / `import()` / `export from` patterns.
- 🎨 **Colorful output** — pretty text by default, `--format json` for machines.
- 📦 **Scoped packages** — `@types/foo` maps to `foo` automatically.
- 🚫 **Ignore patterns** — `--ignore "eslint*"` for tools that don't get imported.
- 🔧 **CI-friendly** — exits 0 when clean, exits 1 when unused deps found.
- 🏗️ **Dev deps** — checks devDependencies by default; `--no-include-dev` to skip.
- 🌍 **Local-first** — no network calls, no telemetry, no analytics.

## Usage

```
unuseddeps [dir] [options]

Options:
  -i, --ignore <patterns...>    Ignore packages matching glob patterns
  -f, --format <format>         Output format: text (default) or json
  --include-dev                 Include devDependencies (default: true)
  --no-include-dev              Skip devDependencies
  --no-color                    Disable colored output (CI-friendly)
  --scan-pattern <patterns...>  Additional source file patterns
  -h, --help                    Show help
  -V, --version                 Show version
```

### Examples

```bash
# Basic usage
unuseddeps

# JSON output for scripts
unuseddeps --format json

# Ignore build tools (they're CLI tools, not imported)
unuseddeps --ignore "typescript" --ignore "prettier"

# Only check production deps
unuseddeps --no-include-dev

# Custom source patterns
unuseddeps --scan-pattern "server/**/*.ts"

# Combine flags
unuseddeps --ignore "eslint*" --format json --no-color
```

### CI integration

**GitHub Actions:**

```yaml
- name: Check unused dependencies
  run: npx unuseddeps --format json
```

**npm script:**

```json
{
  "scripts": {
    "check-deps": "unuseddeps --format json"
  }
}
```

## How it works

```
package.json       →  { express, lodash, axios, chalk }
                        ↓
Source files (.ts/.tsx/.js/.jsx/.mjs/.cjs)
                        ↓
import statements  →  { express, lodash }
                        ↓
Cross-reference    →  Unused: axios, chalk  ✓ Report
                        →  Used: express, lodash, @types/express
```

1. **Parse** `package.json` for all dependencies, devDependencies, peerDependencies, and optionalDependencies.
2. **Scan** every source file for `import`, `require()`, dynamic `import()`, and `export from` statements.
3. **Cross-reference** declared vs. imported packages — with smart handling of `@types/*` mapping.
4. **Report** unused packages with suggestions. Exit non-zero when unused deps found.

### Smart aliasing

When you declare `@types/express` but import `express`, `unuseddeps` knows they're linked. No false positives on type packages.

### Peer & optional dependencies

Peer dependencies and optional dependencies are **never** flagged as unused — they're declared for consumers of your library, not for your own imports.

## Programmatic API

```ts
import { detectUnused } from 'unuseddeps';

const report = detectUnused('./my-project', {
  includeDev: true,
  ignore: ['eslint*'],
});

console.log(report.unused);  // ['axios', 'moment']
console.log(report.used);    // ['express', 'lodash']
```

## Installation

```bash
# Global CLI
npm install -g unuseddeps

# Or as dev dependency
npm install -D unuseddeps
```

## What about depcheck / knip?

They're great tools! `unuseddeps` is a different take:

| Feature | unuseddeps | depcheck | knip |
|---------|------------|----------|------|
| Config | Zero | Optional | Required |
| Network | Never | Sometimes | Yes |
| CI focus | ✅ First-class | Partial | ✅ |
| Size | ~100KB | ~2MB | ~5MB |
| Speed | Fast | Medium | Medium |

Think of it as the lightweight, no-nonsense option. 🧭

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for developer guide.

TL;DR: fork, branch, code, test, PR. Be kind to each other. ✌️

## Inspiration

Patterns observed from depcheck and knip, but built from scratch with a focus on simplicity and zero-config defaults. Not a rewrite, a rethink.

## License

[MIT](LICENSE) — do what you want, just don't sue me. 😄

## Author

[Roger Chappel](https://github.com/rogerchappel)
