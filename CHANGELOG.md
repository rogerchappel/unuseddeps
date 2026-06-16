# Changelog

All notable changes to this project will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format and uses semantic versioning when versioned releases are published.

## [Unreleased]

### Added

- CLI for scanning JavaScript and TypeScript projects for declared dependencies that are not imported by source files.
- JSON and text output modes for local use and CI pipelines.
- Fixture-backed tests covering clean projects, scoped packages, dev-only dependencies, and unused dependency reports.
- Release-candidate package checks with `npm run package:smoke` and `npm run release:check`.

### Changed

- Replaced template changelog content with release notes specific to `unuseddeps`.
- Clarified README comparison language to avoid unverifiable benchmark and package-size claims.

## Release Links

- Unreleased:
  `https://github.com/rogerchappel/unuseddeps/compare/v0.1.0...HEAD`
- Latest release:
  `https://github.com/rogerchappel/unuseddeps/releases/latest`
