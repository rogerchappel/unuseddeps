import { describe, it, expect } from 'vitest';
import { scanFileSource, FILE_EXTENSIONS } from './scanner.js';

describe('scanFileSource', () => {
  it('detects ES imports', () => {
    const result = scanFileSource(`import express from 'express';\nimport { foo } from 'bar';`);
    expect(result).toEqual(new Set(['express', 'bar']));
  });

  it('detects require calls', () => {
    const result = scanFileSource(`const _ = require('lodash');`);
    expect(result).toEqual(new Set(['lodash']));
  });

  it('detects dynamic imports', () => {
    const result = scanFileSource(`const mod = await import('axios');`);
    expect(result).toEqual(new Set(['axios']));
  });

  it('detects re-exports', () => {
    const result = scanFileSource(`export { foo } from 'bar';\nexport * from 'baz';`);
    expect(result).toEqual(new Set(['bar', 'baz']));
  });

  it('skips relative imports', () => {
    const result = scanFileSource(`import { helper } from './helper';\nimport './config';`);
    expect(result).toEqual(new Set());
  });

  it('skips node builtins', () => {
    const result = scanFileSource(`import fs from 'node:fs';`);
    expect(result).toEqual(new Set());
  });

  it('extracts top-level package from sub-package', () => {
    const result = scanFileSource(`import fp from 'lodash/fp';`);
    expect(result).toEqual(new Set(['lodash']));
  });

  it('handles scoped packages', () => {
    const result = scanFileSource(`import React from '@testing-library/react';`);
    expect(result).toEqual(new Set(['@testing-library/react']));
  });

  it('ignores absolute paths', () => {
    const result = scanFileSource(`import x from '/usr/local/lib/x';`);
    expect(result).toEqual(new Set());
  });

  it('ignores http imports', () => {
    const result = scanFileSource(`import x from 'https://example.com/mod.js';`);
    expect(result).toEqual(new Set());
  });

  it('handles side-effect imports', () => {
    const result = scanFileSource(`import 'reflect-metadata';`);
    expect(result).toEqual(new Set(['reflect-metadata']));
  });

  it('handles multiple patterns in one file', () => {
    const source = `
      import express from 'express';
      const _ = require('lodash');
      async function load() {
        const axios = await import('axios');
      }
      export { something } from 'bar';
      import './local';
    `;
    const result = scanFileSource(source);
    expect(result).toEqual(new Set(['express', 'lodash', 'axios', 'bar']));
  });
});

describe('FILE_EXTENSIONS', () => {
  it('includes expected extensions', () => {
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']) {
      expect(FILE_EXTENSIONS.has(ext)).toBe(true);
    }
  });
});
