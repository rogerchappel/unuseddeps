#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
demo_dir="$(mktemp -d "${TMPDIR:-/tmp}/unuseddeps-demo.XXXXXX")"
trap 'rm -rf "$demo_dir"' EXIT

cd "$repo_root"
npm run build

set +e
node dist/cli.js fixtures/unused-three --format json 2> "$demo_dir/unused.json"
unused_status=$?
set -e

if [[ "$unused_status" -ne 1 ]]; then
  echo "expected the unused fixture to exit 1, got $unused_status" >&2
  exit 1
fi

node -e '
  const fs = require("node:fs");
  const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const expected = ["axios", "chalk", "moment"];
  if (JSON.stringify(report.unused) !== JSON.stringify(expected)) {
    throw new Error(`unexpected unused dependencies: ${report.unused.join(", ")}`);
  }
' "$demo_dir/unused.json"

node dist/cli.js fixtures/all-clean --format json > "$demo_dir/clean.json"
node -e '
  const fs = require("node:fs");
  const report = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  if (report.unused.length !== 0 || report.summary !== "Clean (3/3)") {
    throw new Error(`unexpected clean report: ${JSON.stringify(report)}`);
  }
' "$demo_dir/clean.json"

echo "unused fixture: axios, chalk, moment detected (exit 1)"
echo "clean fixture: 3/3 dependencies used (exit 0)"
echo "demo passed"
