# Contributing to unuseddeps

Thanks for wanting to contribute! 🧭

## Quick start for contributors

```bash
git clone https://github.com/rogerchappel/unuseddeps.git
cd unuseddeps
npm install
npm test        # run all tests
npm run build   # compile TypeScript
npm run check   # type check + lint
```

## Project structure

```
src/
  parser.ts      — package.json parsing
  scanner.ts     — import/require statement extraction
  referencer.ts  — cross-reference engine (unused detection)
  reporter.ts    — output formatting (text + JSON)
  cli.ts         — commander CLI entry point
  index.ts       — public API exports + detectUnused()
fixtures/        — sample projects for testing
```

## Before submitting a PR

1. ✅ Run `npm test` — all tests must pass
2. ✅ Run `npm run check` — no type errors or lint failures
3. ✅ Coverage stays above 85% (`npm run test:coverage`)
4. ✅ Commit messages follow Conventional Commits format:
   ```
   feat(scanner): detect dynamic import() patterns
   fix(referencer): handle @types/ aliases correctly
   test: add fixture for monorepo workspaces
   docs(readme): update CI integration examples
   ```

## Code style

- 2-space indentation
- Single quotes
- Semicolons
- ESM imports only (no `require()`)
- TypeScript strict mode

Format with `npm run format`.

## How to contribute

1. Check existing [issues](../../issues) — someone might already be working on it
2. Fork the repo, create a feature branch
3. Write tests for new behavior
4. Submit a PR with a clear description of what changed and why

## Questions?

- File an [issue](../../issues) for bugs or feature requests
- Read [ROADMAP.md](ROADMAP.md) for planned features

## License

By contributing, you agree that your contributions will be licensed under the MIT license.
