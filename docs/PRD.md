# UnusedDeps PRD

Status: in-progress

## Summary

UnusedDeps is a local-first TypeScript CLI that detects unused dependencies in Node.js/TypeScript projects by cross-referencing `package.json` dependencies/devDependencies against actual import/require statements in the source tree.

## Motivation

Projects accumulate stale dependencies over time. Packages are installed for experiments, then forgotten. `npm prune` only removes node_modules not referenced in package.json — it doesn't tell you which declared packages are never imported. Unused deps bloat installs, increase supply-chain risk, and confuse new contributors.

Existing tools (depcheck, knip) are heavy, opinionated about project structure, or require configuration. UnusedDeps is small, zero-config, and works offline.

## Target users

- Developers cleaning up monorepos or trimming package sizes
- CI pipelines that gate on unused dependency count
- OSS maintainers auditing dependency hygiene
- Agentic workflows that need to detect stale packages before suggesting edits

## Goals

- Parse `package.json` for all dependencies and devDependencies
- Statically scan `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` files for import/require/dynamic import
- Cross-reference to find declared-but-never-imported packages
- Support `--ignore` patterns for known intentional exceptions
- Output text report (default) and JSON (`--format json`)
- Exit non-zero when unused deps are found (CI-friendly)
- Handle aliased imports, scoped packages (`@types/*`), and workspace packages

## Non-goals

- Detecting unused files or dead code (use a bundler/tsc for that)
- Runtime analysis (no execution)
- Modifying package.json automatically

## Source attribution

Inspired by general patterns from depcheck, knip, and npm-prune discussions. This is a reframed local-first take focused on simplicity and zero-config defaults rather than feature parity with those tools.
