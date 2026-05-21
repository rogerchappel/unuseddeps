import { describe, it, expect } from 'vitest';
import { findUnused, normalizePackageName } from './referencer.js';

describe('normalizePackageName', () => {
  it('strips @types/ prefix from scoped packages', () => {
    expect(normalizePackageName('@types/lodash')).toBe('lodash');
  });

  it('leaves non-@types packages alone', () => {
    expect(normalizePackageName('lodash')).toBe('lodash');
    expect(normalizePackageName('@babel/core')).toBe('@babel/core');
  });

  it('leaves bare @types alone', () => {
    expect(normalizePackageName('@types')).toBe('@types');
  });
});

describe('findUnused', () => {
  function manifest(partial: Record<string, Record<string, string>>) {
    return {
      deps: partial.deps ?? {},
      devDeps: partial.devDeps ?? {},
      peerDeps: partial.peerDeps ?? {},
      optDeps: partial.optDeps ?? {},
    };
  }

  it('finds unused dependencies', () => {
    const result = findUnused(
      manifest({ deps: { express: '1', axios: '1', lodash: '1' } }),
      new Set(['express', 'lodash']),
    );
    expect(result.unused).toEqual(['axios']);
    expect(result.used).toEqual(['express', 'lodash']);
  });

  it('marks @types packages as used when base is imported', () => {
    const result = findUnused(
      manifest({
        deps: { express: '1' },
        devDeps: { '@types/express': '1' },
      }),
      new Set(['express']),
    );
    expect(result.unused).toEqual([]);
    expect(result.used).toContain('@types/express');
    expect(result.used).toContain('express');
  });

  it('handles --ignore patterns', () => {
    const result = findUnused(
      manifest({ deps: { chalk: '1', 'eslint-plugin-foo': '1' } }),
      new Set(['chalk']),
      { ignore: ['eslint-*'] },
    );
    expect(result.unused).toEqual([]);
    expect(result.ignored).toContain('eslint-plugin-foo');
  });

  it('handles --no-include-dev', () => {
    const result = findUnused(
      manifest({ deps: {}, devDeps: { vitest: '1' } }),
      new Set(),
      { includeDev: false },
    );
    // With dev deps excluded, there's nothing declared → no unused
    expect(result.unused).toEqual([]);
    expect(result.totalDeclared).toBe(0);
  });

  it('returns correct total count', () => {
    const result = findUnused(
      manifest({
        deps: { a: '1', b: '1' },
        devDeps: { c: '1' },
      }),
      new Set(['a']),
    );
    expect(result.totalDeclared).toBe(3);
    expect(result.used.length).toBe(1);
    expect(result.unused.length).toBe(2);
  });

  it('sorts output alphabetically', () => {
    const result = findUnused(
      manifest({ deps: { z: '1', a: '1', m: '1' } }),
      new Set(),
    );
    expect(result.unused).toEqual(['a', 'm', 'z']);
  });

  it('handles peer deps (never flagged)', () => {
    const result = findUnused(
      manifest({ deps: {}, peerDeps: { react: '1' } }),
      new Set(),
    );
    expect(result.unused).toEqual([]);
    expect(result.used).toContain('react');
  });

  it('handles opt deps (never flagged)', () => {
    const result = findUnused(
      manifest({ deps: {}, optDeps: { fsevents: '1' } }),
      new Set(),
    );
    expect(result.unused).toEqual([]);
    expect(result.used).toContain('fsevents');
  });
});
