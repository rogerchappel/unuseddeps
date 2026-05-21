import { ESLint } from 'eslint';
import { describe, it, expect } from 'vitest';

describe('demo', () => {
  it('should pass', () => {
    const eslint = new ESLint({ useEslintrc: false });
    expect(eslint).toBeDefined();
  });
});
