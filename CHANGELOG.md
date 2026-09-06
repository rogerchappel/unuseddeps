# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Documentation

- Replaced unavailable npm registry onboarding with a working source checkout,
  build, and CLI workflow, including a source-based GitHub Actions example.

### Added

- CLI for scanning JavaScript and TypeScript projects for declared dependencies that are not imported by source files.
- JSON and text output modes for local use and CI pipelines.
- Fixture-backed tests covering clean projects, scoped packages, dev-only dependencies, and unused dependency reports.
- Release-candidate package checks with `npm run package:smoke` and `npm run release:check`.
- Strict packed-package consumer verification across supported Node.js releases.

### Changed

- Replaced template changelog content with release notes specific to `unuseddeps`.
- Clarified README comparison language to avoid unverifiable benchmark and package-size claims.
- Set Node.js 20 as the minimum runtime and aligned CI with supported Node.js 20, 22, and 24 releases.

### Fixed

- Recognize static package specifiers in dynamic `import()` and direct
  `require.resolve()` calls that include an options argument.
- Ignore import-like text inside comments and string or template literals when scanning dependencies.
- Match `workspace:`, `file:`, and `link:` dependencies by package name so protocol ranges cannot hide unrelated unused dependencies.
- Refresh the development dependency lockfile to use `nanoid` 3.3.18, clearing the transitive audit advisory while preserving the Node.js 20, 22, and 24 CI matrix.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/unuseddeps/compare/v0.1.0...HEAD`
- Latest release:
  `https://github.com/rogerchappel/unuseddeps/releases/latest`
