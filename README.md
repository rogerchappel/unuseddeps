<p align="center">
  🧭 <strong>unuseddeps</strong>
</p>

<p align="center">
  Detect unused Node.js dependencies — zero config, local-first, CI-friendly.
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg?style=flat" alt="Node.js 20 or newer"></a>
  <a href="https://github.com/rogerchappel/unuseddeps/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/rogerchappel/unuseddeps/ci.yml?style=flat" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat" alt="License"></a>
</p>

---

## The problem

You're three months into a project. You've tried Express, hapi, Fastify, and Koa — and settled on Koa. But your `package.json` still installs all four. Nobody remembers to clean up. `npm prune` won't help — it only removes packages in `node_modules` that _aren't_ in `package.json`.

**The stale packages that _are_ in `package.json`?** They stay. Forever. 🪦

## The solution

`unuseddeps` scans your source tree for `import` / `require()` / `require.resolve()` / `import()` / `export from` statements, cross-references against `package.json`, and tells you exactly which declared dependencies are never imported.

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
# Install and build the current source
git clone https://github.com/rogerchappel/unuseddeps.git
cd unuseddeps
npm ci
npm run build

# Scan a project (replace the path with your project directory)
node dist/cli.js /path/to/your-project

# Check in CI (fails on unused dependencies)
node dist/cli.js /path/to/your-project --format json
```

The npm registry package is not published yet, so `npm install unuseddeps` and
`npx unuseddeps` are not currently available. The source workflow above is the
supported installation path until publication. No config file is needed.

## Runnable demo

Run a deterministic comparison using only the checked-in fixtures:

```bash
npm install
npm run demo
```

The demo builds the CLI, proves that `fixtures/unused-three` reports `axios`,
`chalk`, and `moment` with exit code `1`, then proves that `fixtures/all-clean`
has no unused dependencies and exits `0`. It does not install fixture packages
or make network calls after the initial project install.

## Features

- ⚡ **Zero config** — just run it. Reads `package.json`, scans your source, done.
- 🎯 **Accurate** — static analysis finds all `import` / `require()` / `require.resolve()` / `import()` / `export from` patterns.
- 🎨 **Colorful output** — pretty text by default, `--format json` for machines.
- 📦 **Scoped packages** — `@types/foo` maps to `foo` automatically.
- 🔗 **Local packages** — `workspace:`, `file:`, and `link:` dependencies are ignored by declared package name.
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
- name: Check out unuseddeps
  uses: actions/checkout@v4
  with:
    repository: rogerchappel/unuseddeps
    path: .unuseddeps

- name: Build unuseddeps
  run: npm ci --prefix .unuseddeps && npm run --prefix .unuseddeps build

- name: Check unused dependencies
  run: node .unuseddeps/dist/cli.js . --format json
```

**npm script:**

```json
{
  "scripts": {
    "check-deps": "node .unuseddeps/dist/cli.js . --format json"
  }
}
```

The script assumes `unuseddeps` has been checked out and built at
`.unuseddeps`, as in the Actions example.

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
2. **Scan** every source file, including executable Vite and Vitest config files, for `import`, `require()`, `require.resolve()`, dynamic `import()`, and `export from` statements. Generated and vendor directories (`node_modules`, `dist`, `build`, and `coverage`) are excluded by default.
3. **Cross-reference** declared vs. imported packages — with smart handling of `@types/*` mapping.
4. **Report** unused packages with suggestions. Exit non-zero when unused deps found.

### Recognized module references

Module specifiers must be static string literals or template literals without substitutions. The scanner recognizes ES imports and re-exports, direct `require('package')`, direct `require.resolve('package')`, and dynamic `import('package')`, including executable references inside `${...}` template substitutions. Computed template module specifiers such as `` import(`package/${name}`) `` are not recognized. Package subpaths resolve to their top-level package, including scoped packages such as `require.resolve('@scope/tool/runtime')`.

Node.js built-ins are recognized in both `node:` form (such as `node:fs`) and supported bare form (such as `fs` or `fs/promises`). These references count as usage evidence for `@types/node`.

Computed names such as `require.resolve(packageName)` are not inferred. Calls on other objects or member chains, such as `resolver.resolve('package')` or `loader.require.resolve('package')`, are not treated as module references.

### Smart aliasing

When you declare `@types/express` but import `express`, `unuseddeps` knows they're linked. Node.js built-in references similarly map to `@types/node`; they do not mark unrelated `@types/*` packages as used.

### Peer & optional dependencies

Peer dependencies and optional dependencies are **never** flagged as unused — they're declared for consumers of your library, not for your own imports.

### Local dependencies

Dependencies declared with `workspace:`, `file:`, or `link:` ranges are treated
as local packages and are not flagged as unused. Only the package carrying the
local range is ignored; other unused dependencies remain in the report.

### Invalid manifests

Each dependency section in `package.json` must be an object whose values are
string version ranges. Malformed JSON, non-object dependency sections, and
non-string ranges exit with code `1` and a concise `Invalid package.json`
error; the CLI does not print a stack trace.

## Programmatic API

The package is not yet available from npm. This API example applies to a future
registry release; for now, use the source-built CLI documented above.

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

`unuseddeps` requires Node.js 20 or newer. CI verifies the active Node.js 20,
22, and 24 LTS release lines.

```bash
# Clone, install exact dependencies, and build
git clone https://github.com/rogerchappel/unuseddeps.git
cd unuseddeps
npm ci
npm run build

# Run against any Node.js project
node dist/cli.js /path/to/your-project
```

The npm registry package is currently unavailable. Registry installation
commands will be documented here after the first package publication.

## What about depcheck / knip?

They're useful tools with broader ecosystems. `unuseddeps` keeps a narrower release surface:

| Feature | unuseddeps | depcheck | knip |
|---------|------------|----------|------|
| Primary goal | Small dependency scan | General dependency analysis | Workspace dependency analysis |
| Default setup | No config file | Optional config | Config often useful |
| Local-first mode | Yes | Tool-dependent | Tool-dependent |
| CI behavior | Non-zero on unused deps | Supported | Supported |

Choose `unuseddeps` when you want a focused local scan with a small, explicit CLI surface.

## Release verification

```bash
npm run check
npm test
npm run audit:all
npm run audit:prod
npm run build
npm run smoke
npm run package:smoke
npm run package:consumer
npm run release:check
```

`npm run package:smoke` builds the CLI, runs `npm pack --dry-run`, and asserts
the published package allowlist, executable bin, and CLI shebang. The package
ships compiled `dist` output plus the README, license, security policy, and
changelog; source fixtures and test coverage reports stay out of the npm
artifact.

`npm run package:consumer` packs the real release artifact, installs it into a
clean consumer project with npm's `engine-strict` setting enabled, and runs the
installed CLI. CI performs this check on every supported Node.js release line.

The two audit commands gate both the complete development graph and the
production install graph. `npm run release:check` includes both, so known npm
advisories block a release as well as CI.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for developer guide.

TL;DR: fork, branch, code, test, PR. Be kind to each other. ✌️

## Inspiration

Patterns observed from depcheck and knip, but built from scratch with a focus on simplicity and zero-config defaults. Not a rewrite, a rethink.

## Limitations and Safety

- Detect unused Node.js dependencies — zero config, local-first, CI-friendly; it is intended for local, reviewable developer workflows rather than unattended production automation.
- Review generated output before using it in commits, releases, issue updates, or connector actions.
- Avoid passing secrets, private customer data, or unredacted logs through fixtures, examples, or command output.
- Treat warnings and non-zero exits from `unuseddeps` as review signals, then rerun the documented verification command after changes.

## License

[MIT](LICENSE) — do what you want, just don't sue me. 😄

## Author

[Roger Chappel](https://github.com/rogerchappel)
