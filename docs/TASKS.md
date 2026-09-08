# UnusedDeps - Task Status

This document separates shipped behavior from roadmap work. Each completed area
links to executable evidence so the status can be checked as the project evolves.

## Current

- [x] Package and TypeScript scaffold: [`package.json`](../package.json),
  [`tsconfig.json`](../tsconfig.json), and [`src/cli.ts`](../src/cli.ts) define the
  ESM package, build, CLI entry point, and release checks. The package currently
  declares `commander`, `glob`, and `picocolors`; the obsolete planned `yaml`
  dependency is no longer part of the manifest.
- [x] Manifest parsing: [`src/parser.ts`](../src/parser.ts) reads dependencies,
  devDependencies, peerDependencies, and optionalDependencies, with coverage in
  [`src/parser.test.ts`](../src/parser.test.ts).
- [x] Import scanning: [`src/scanner.ts`](../src/scanner.ts) recognizes static
  imports, `require()`, dynamic imports, re-exports, scoped packages, Node.js
  built-ins, and the supported TypeScript/JavaScript extensions. See
  [`src/scanner.test.ts`](../src/scanner.test.ts).
- [x] Dependency cross-reference: [`src/referencer.ts`](../src/referencer.ts)
  compares declared and imported packages, preserves peer/optional dependencies,
  and supports ignore patterns and excluding devDependencies. See
  [`src/referencer.test.ts`](../src/referencer.test.ts).
- [x] Text and JSON reporting: [`src/reporter.ts`](../src/reporter.ts) formats
  colorized terminal output and machine-readable output. Clean scans exit 0,
  unused-dependency scans exit 1, and usage errors exit 2, as covered by
  [`src/cli.test.ts`](../src/cli.test.ts).
- [x] CLI workflow: scan a directory (default `.`), choose `--format`, repeat
  `--ignore`, use `--no-include-dev`, or disable color. The authoritative options
  and examples are in [`README.md`](../README.md) and [`src/cli.ts`](../src/cli.ts);
  obsolete planned flag names are not retained here.
- [x] Fixtures and verification: [`fixtures/`](../fixtures/) covers clean, unused,
  dev-only, and scoped-package projects. `npm run release:check` runs audits,
  type/lint, 97 tests, dependency self-check, build, CLI smoke, and package smokes.
- [x] Maintainer documentation and metadata: [`README.md`](../README.md),
  [`CONTRIBUTING.md`](../CONTRIBUTING.md), and [`package.json`](../package.json)
  describe the implemented package and its repository metadata.

## Next

- [ ] Design and implement TypeScript path-alias resolution; the scanner currently
  treats package-like specifiers literally and does not read `paths` mappings.
- [ ] Define workspace-package discovery and internal-alias behavior before adding
  monorepo-specific cross-reference rules.
- [ ] Decide whether configuration files should be supported. Current behavior is
  deliberately zero-config and exposes options through the CLI and module API.
- [ ] Add an explicit coverage threshold only after the threshold and CI policy are
  agreed; the current release gate runs the full test suite without a numeric floor.
