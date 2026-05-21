# UnusedDeps - Implementation Tasks

## Phase 0: PRD (done)
- [x] Write PRD.md

## Phase 1: Scaffold & Package
- [ ] Set up package.json: name=unuseddeps, type=module, main entry point
- [ ] Configure tsconfig.json for ESM
- [ ] Add dependencies: tsx (dev), glob, yaml, @types/node, commander, picocolors
- [ ] Set up eslint config, prettier config
- [ ] Create src/index.ts (CLI entry), src/scanner.ts, src/parser.ts, src/reporter.ts
- [ ] Set up vitest config
- [ ] Create src/cli.ts (commander CLI)

## Phase 2: Core Parser
- [ ] Implement package.json parser to extract all dependencies and devDependencies
- [ ] Implement TypeScript/JSX import scanner: handle `import`, `require()`, `import()`, `export from`
- [ ] Handle scoped packages (@types/* should map to the package without @types prefix)
- [ ] Handle aliased imports via tsconfig paths
- [ ] Support .ts, .tsx, .js, .jsx, .mjs, .cjs file extensions

## Phase 3: Cross-Reference Engine
- [ ] Compare declared deps vs imported packages
- [ ] Support --ignore patterns for known exemptions
- [ ] Handle workspace packages and internal aliases
- [ ] Handle peerDependencies (don't flag as unused)

## Phase 4: Reporter
- [ ] Implement text output mode (default): list unused deps with suggestion
- [ ] Implement JSON output mode (--format json)
- [ ] Colorized output with picocolors
- [ ] Exit code 0 = clean, exit code 1 = unused deps found

## Phase 5: CLI Commands
- [ ] Main command: scan directory (default .)
- [ ] Flags: --ignore, --format, --include-dev, --base-dir
- [ ] Help text and usage examples

## Phase 6: Tests & Fixtures
- [ ] Create fixtures/ with sample project containing:
  - project with no unused deps
  - project with 3 unused deps
  - project with only devDeps used
  - project with scoped packages
- [ ] Write unit tests for parser
- [ ] Write unit tests for scanner
- [ ] Write unit tests for cross-reference engine
- [ ] Write integration test for CLI
- [ ] Run vitest, ensure >90% coverage

## Phase 7: Docs & Polish
- [ ] Write README with personality, examples, installation, usage
- [ ] Write CONTRIBUTING.md
- [ ] Update package.json description, keywords, repository fields
- [ ] Run npm test, npm run build, npm run check
- [ ] Smoke test: run `npx tsx src/cli.ts` on fixtures
