import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { parseManifest, getAllDeclared } from './parser.js';
import { scanFiles, FILE_EXTENSIONS } from './scanner.js';
import { findUnused } from './referencer.js';
import { glob } from 'glob';

/** Helper: run full pipeline on a fixture directory */
function runFixture(name: string, opts: { includeDev?: boolean; ignore?: string[] }) {
  const dir = resolve(__dirname, '..', 'fixtures', name);
  const pkg = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf-8'));
  const manifest = parseManifest(JSON.stringify(pkg));

  const exts = [...FILE_EXTENSIONS].map(e => `**/*${e}`);
  const files = glob.sync(exts, { cwd: dir, nodir: true, absolute: true, ignore: ['node_modules', 'dist'] });

  const { imports } = scanFiles(files);
  const report = findUnused(manifest, imports, { ...opts });
  report.scannedFiles = files.length;
  return report;
}

describe('integration: all-clean fixture', () => {
  it('should find no unused deps', () => {
    const report = runFixture('all-clean', {});
    expect(report.unused).toEqual([]);
    expect(report.used.length).toBeGreaterThan(0);
  });
});

describe('integration: unused-three fixture', () => {
  it('should find 3 unused deps', () => {
    const report = runFixture('unused-three', {});
    expect(report.unused).toEqual(['axios', 'chalk', 'moment']);
  });
});

describe('integration: scoped fixture', () => {
  it('should resolve @types/express via base import', () => {
    const report = runFixture('scoped', {});
    expect(report.unused).toEqual([]);
  });
});

describe('integration: dev-only fixture', () => {
  it('with devDeps included should find none unused', () => {
    const report = runFixture('dev-only', { includeDev: true });
    expect(report.unused).toEqual([]);
  });

  it('with --no-include-dev should find none checkable', () => {
    const report = runFixture('dev-only', { includeDev: false });
    // No deps, only devDeps with includeDev=false → nothing to check
    expect(report.unused).toEqual([]);
    expect(report.totalDeclared).toBe(0);
  });
});
