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

  it('detects static require.resolve calls', () => {
    const result = scanFileSource(`
      const plain = require.resolve('lodash');
      const scoped = require.resolve('@testing-library/react');
      const subpath = require.resolve('date-fns/format');
    `);

    expect(result).toEqual(new Set(['lodash', '@testing-library/react', 'date-fns']));
  });

  it('ignores dynamic and unrelated resolve calls', () => {
    const result = scanFileSource(`
      require.resolve(packageName);
      loader.require.resolve('axios');
      require.other.resolve('chalk');
      resolver.resolve('moment');
    `);

    expect(result).toEqual(new Set());
  });

  it('detects dynamic imports', () => {
    const result = scanFileSource(`const mod = await import('axios');`);
    expect(result).toEqual(new Set(['axios']));
  });

  it('detects static dynamic imports with no-substitution template literals', () => {
    const result = scanFileSource('const mod = await import(`lodash`);');
    expect(result).toEqual(new Set(['lodash']));
  });

  it('detects re-exports', () => {
    const result = scanFileSource(`export { foo } from 'bar';\nexport * from 'baz';`);
    expect(result).toEqual(new Set(['bar', 'baz']));
  });

  it('skips relative imports', () => {
    const result = scanFileSource(`import { helper } from './helper';\nimport './config';`);
    expect(result).toEqual(new Set());
  });

  it('records node: builtins as @types/node usage evidence', () => {
    const result = scanFileSource(`import fs from 'node:fs';`);
    expect(result).toEqual(new Set(['@types/node']));
  });

  it('records supported bare builtins and subpaths as @types/node usage evidence', () => {
    const result = scanFileSource(`
      const fs = require('fs');
      import promises from 'fs/promises';
    `);
    expect(result).toEqual(new Set(['@types/node']));
  });

  it('does not treat packages that merely start with builtin names as builtins', () => {
    const result = scanFileSource(`import extra from 'fs-extra';`);
    expect(result).toEqual(new Set(['fs-extra']));
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

  it('ignores imports in line comments', () => {
    const source = `
      // import fake from 'lodash';
      import real from 'express';
    `;

    expect(scanFileSource(source)).toEqual(new Set(['express']));
  });

  it('ignores require calls in block comments', () => {
    const source = `
      /* require('chalk') */
      const real = require('picocolors');
    `;

    expect(scanFileSource(source)).toEqual(new Set(['picocolors']));
  });

  it('ignores import and export syntax in quoted strings', () => {
    const source = `
      const importExample = "import fake from 'axios'";
      const exportExample = "export * from 'moment'";
      export { real } from 'yaml';
    `;

    expect(scanFileSource(source)).toEqual(new Set(['yaml']));
  });

  it('ignores module syntax in template literals', () => {
    const source = `
      const example = \`import('ora'); require('kleur')\`;
      const real = import('glob');
    `;

    expect(scanFileSource(source)).toEqual(new Set(['glob']));
  });

  it('detects module references in executable template substitutions', () => {
    const source = `
      const required = \`${'${require("lodash")}'}\`;
      const imported = \`${'${import("axios")}'}\`;
    `;

    expect(scanFileSource(source)).toEqual(new Set(['lodash', 'axios']));
  });

  it('handles nested syntax in executable template substitutions', () => {
    const source = `
      const nested = \`${'${condition ? { module: require("chalk") } : `${import("ora")}`}'}\`;
    `;

    expect(scanFileSource(source)).toEqual(new Set(['chalk', 'ora']));
  });

  it('keeps computed template module specifiers unrecognized', () => {
    const source = `
      const required = require(\`lodash/${'${flavor}'}\`);
      const imported = import(\`@scope/${'${moduleName}'}\`);
    `;

    expect(scanFileSource(source)).toEqual(new Set());
  });

  it('ignores module syntax in regex literals without hiding adjacent imports', () => {
    const source = `
      const importPattern = /import fake from ['"]axios['"]/;
      import chalk from 'chalk';
    `;

    expect(scanFileSource(source)).toEqual(new Set(['chalk']));
  });
});

describe('FILE_EXTENSIONS', () => {
  it('includes expected extensions', () => {
    for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']) {
      expect(FILE_EXTENSIONS.has(ext)).toBe(true);
    }
  });
});
