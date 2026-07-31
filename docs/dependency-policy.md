# Dependency Policy

This repository uses Dependabot for GitHub Actions and checks the npm graph in
CI and release verification.

## Baseline policy

- Dependabot checks workflow action versions weekly.
- Dependency pull requests should be small and reviewed like any other change.
- Avoid major dependency upgrades in the same commit as feature work.
- Keep the lockfile current and require both `npm run audit:all` and
  `npm run audit:prod` to report zero known vulnerabilities.

## Node/npm updates

If npm Dependabot updates are enabled later, add this entry:

```yaml
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    commit-message:
      prefix: chore
```

Run `npm run release:check` before merging dependency updates. It covers both
audit scopes, lint, typechecking, tests, the build, and package smoke tests.
