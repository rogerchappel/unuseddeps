import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { detectUnused } from './index.js';

describe('detectUnused', () => {
  it('uses the same excluded directory defaults as the CLI', () => {
    const fixture = resolve(__dirname, '..', 'fixtures', 'ignored-directories');

    expect(detectUnused(fixture)).toMatchObject({
      unused: ['chalk', 'left-pad'],
      used: [],
      scannedFiles: 1,
    });
  });

  it('ignores local protocol dependencies by package name', () => {
    const fixture = resolve(__dirname, '..', 'fixtures', 'local-protocols');

    expect(detectUnused(fixture)).toMatchObject({
      unused: ['lodash', 'vitest'],
      used: ['local-file', 'local-link', 'local-workspace'],
      ignored: ['local-file', 'local-link', 'local-workspace'],
      scannedFiles: 1,
    });
  });
});
