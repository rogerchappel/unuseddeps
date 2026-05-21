import { describe, it, expect } from 'vitest';
import { formatReport, exitCode } from './reporter.js';
import type { UnusedReport } from './referencer.js';

function makeReport(overrides: Partial<UnusedReport> = {}): UnusedReport {
  return { unused: [], used: [], totalDeclared: 0, scannedFiles: 0, ignored: [], ...overrides };
}

describe('formatReport', () => {
  it('returns text output with header when clean', () => {
    const out = formatReport(makeReport({ used: ['express'], totalDeclared: 1 }), { format: 'text' });
    expect(out).toContain('unuseddeps');
    expect(out).toContain('No unused dependencies found');
  });

  it('returns text output listing unused when present', () => {
    const out = formatReport(makeReport({ unused: ['axios', 'chalk'], used: ['express'], totalDeclared: 3, scannedFiles: 5 }), { format: 'text' });
    expect(out).toContain('Found 2 unused dependencies');
    expect(out).toContain('axios');
    expect(out).toContain('chalk');
    expect(out).toContain('Scanned 5 files');
  });

  it('includes ignored section', () => {
    const out = formatReport(makeReport({ ignored: ['eslint-plugin-foo'] }), { format: 'text' });
    expect(out).toContain('Ignored:');
    expect(out).toContain('eslint-plugin-foo');
  });

  it('returns valid JSON when format=json', () => {
    const out = formatReport(makeReport({ unused: ['x'], used: ['y'], totalDeclared: 2, scannedFiles: 10, ignored: [] }), { format: 'json' });
    const parsed = JSON.parse(out);
    expect(parsed.unused).toEqual(['x']);
    expect(parsed.summary).toBeDefined();
  });

  it('JSON output includes summary', () => {
    const out = formatReport(makeReport({ used: ['a'], totalDeclared: 1 }), { format: 'json' });
    const parsed = JSON.parse(out);
    expect(typeof parsed.summary).toBe('string');
  });

  it('text output works with noColor=true (no ANSI)', () => {
    const out = formatReport(makeReport({ unused: ['x'] }), { format: 'text', noColor: true });
    expect(out).not.toContain('\x1b[');
    expect(out).toContain('x');
  });
});

describe('exitCode', () => {
  it('returns 0 when no unused deps', () => {
    expect(exitCode(makeReport())).toBe(0);
  });

  it('returns 1 when unused deps exist', () => {
    expect(exitCode(makeReport({ unused: ['axios'] }))).toBe(1);
  });
});
