import { describe, it, expect } from 'vitest';
import { parseManifest, getNonFlagSet, getAllDeclared } from './parser.js';

describe('parseManifest', () => {
  it('parses dependencies and devDependencies', () => {
    const result = parseManifest(JSON.stringify({
      dependencies: { express: '^4.18.0' },
      devDependencies: { vitest: '^2.0.0' },
    }));
    expect(result.deps).toEqual({ express: '^4.18.0' });
    expect(result.devDeps).toEqual({ vitest: '^2.0.0' });
  });

  it('handles missing deps gracefully', () => {
    const result = parseManifest('{}');
    expect(result.deps).toEqual({});
    expect(result.devDeps).toEqual({});
    expect(result.peerDeps).toEqual({});
    expect(result.optDeps).toEqual({});
  });

  it('parses peer and optional dependencies', () => {
    const result = parseManifest(JSON.stringify({
      peerDependencies: { react: '^18.0.0' },
      optionalDependencies: { fsevents: '^2.3.0' },
    }));
    expect(result.peerDeps).toEqual({ react: '^18.0.0' });
    expect(result.optDeps).toEqual({ fsevents: '^2.3.0' });
  });

  it.each([
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ])('rejects a malformed %s section', (section) => {
    expect(() => parseManifest(JSON.stringify({ [section]: [] })))
      .toThrow(`Invalid package.json: "${section}" must be an object of string ranges`);
  });

  it.each([
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ])('rejects a non-string range in %s', (section) => {
    expect(() => parseManifest(JSON.stringify({ [section]: { broken: 42 } })))
      .toThrow(`Invalid package.json: "${section}.broken" must be a string range`);
  });

  it('rejects malformed JSON with a stable error', () => {
    expect(() => parseManifest('{')).toThrow('Invalid package.json: malformed JSON');
  });
});

describe('getNonFlagSet', () => {
  const manifest = { deps: { a: '1' }, devDeps: { b: '1' }, peerDeps: { c: '1' }, optDeps: {} };

  it('includes dev deps by default', () => {
    const result = getNonFlagSet(manifest);
    expect([...result]).toContain('b');
  });

  it('excludes dev deps when includeDev = false', () => {
    const result = getNonFlagSet(manifest, false);
    expect([...result]).not.toContain('b');
  });
});

describe('getAllDeclared', () => {
  it('returns all declared packages', () => {
    const result = getAllDeclared({
      deps: { a: '1' },
      devDeps: { b: '1' },
      peerDeps: { c: '1' },
      optDeps: {},
    });
    expect(result).toEqual(new Set(['a', 'b', 'c']));
  });
});
