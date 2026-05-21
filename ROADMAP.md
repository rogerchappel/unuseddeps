# 🧭 unuseddeps — Roadmap

## Now (v0.1)

- [x] Core scanning engine (import/require/export)
- [x] CLI with commander
- [x] Text + JSON output
- [x] CI-friendly exit codes

## Soon (v0.2)

- [ ] Workspace / monorepo support (pnpm, npm, yarn)
- [ ] Custom tsconfig path alias resolution
- [ ] `--include` patterns to limit scan scope
- [ ] SARIF output for GitHub Advanced Security

## Later

- [ ] ESLint plugin (`@unuseddeps/eslint-plugin`)
- [ ] VSCode extension
- [ ] Performance mode (parallel file scanning)
- [ ] Plugin system for custom resolvers (webpack aliases, etc.)
- [ ] Report diff mode: only flag newly-unused deps

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).
