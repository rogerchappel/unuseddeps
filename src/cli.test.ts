import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

const CLI = resolve(__dirname, 'cli.ts');
const TSX = resolve(__dirname, '..', 'node_modules', 'tsx', 'dist', 'cli.mjs');

/** Run the CLI as a sub-process, capturing both stdout and stderr */
function runCli(args: string[], cwd: string) {
  try {
    const stdout = execFileSync(process.execPath, [TSX, CLI, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', code: 0 };
  } catch (err: any) {
    return {
      stdout: err.stdout?.toString() || '',
      stderr: err.stderr?.toString() || '',
      code: err.status ?? 1,
    };
  }
}

describe('cli: unused-three fixture', () => {
  const fixture = resolve(__dirname, '..', 'fixtures', 'unused-three');

  it('exits 1 when unused deps found', () => {
    const result = runCli([], fixture);
    expect(result.code).toBe(1);
  });

  it('lists unused deps in output', () => {
    const result = runCli([], fixture);
    const output = result.stderr || result.stdout;
    expect(output).toContain('axios');
    expect(output).toContain('chalk');
    expect(output).toContain('moment');
  });

  it('supports --format json', () => {
    const result = runCli(['--format', 'json'], fixture);
    const output = result.stderr || result.stdout;
    const parsed = JSON.parse(output);
    expect(parsed.unused).toContain('axios');
  });

  it('supports --ignore', () => {
    const result = runCli(['--ignore', 'axios', '--ignore', 'chalk', '--ignore', 'moment'], fixture);
    // With all unused ignored, the tool finds 0 unused
    expect(result.code).toBe(0);
  });

  it('supports --no-include-dev', () => {
    // dev-only fixture: if dev deps excluded, nothing to check
    const fixtureDevOnly = resolve(__dirname, '..', 'fixtures', 'dev-only');
    const result = runCli(['--no-include-dev'], fixtureDevOnly);
    // devOnly has no deps (only devDeps), so with --no-include-dev nothing flagged
    expect(result.code).toBe(0);
  });

  it('supports --no-color', () => {
    const result = runCli(['--no-color'], fixture);
    const output = result.stderr || result.stdout;
    // No ANSI escape codes
    expect(output).not.toContain('\x1b[');
  });
});

describe('cli: all-clean fixture', () => {
  const fixture = resolve(__dirname, '..', 'fixtures', 'all-clean');

  it('exits 0 when no unused deps', () => {
    const result = runCli([], fixture);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Clean');
  });

  it('outputs clean summary in stdout', () => {
    const result = runCli([], fixture);
    expect(result.stdout).toContain('Scanned');
  });
});

describe('cli: node builtins fixture', () => {
  const fixture = resolve(__dirname, '..', 'fixtures', 'node-builtins');

  it('reports unrelated type packages but not @types/node', () => {
    const result = runCli(['--format', 'json'], fixture);
    const report = JSON.parse(result.stderr || result.stdout);

    expect(result.code).toBe(1);
    expect(report.used).toEqual(['@types/node']);
    expect(report.unused).toEqual(['@types/express']);
  });
});

describe('cli: ignored-directories fixture', () => {
  const fixture = resolve(__dirname, '..', 'fixtures', 'ignored-directories');

  it('does not count imports in excluded directory descendants', () => {
    const result = runCli(['--format', 'json'], fixture);
    const report = JSON.parse(result.stderr || result.stdout);

    expect(result.code).toBe(1);
    expect(report.unused).toEqual(['chalk', 'left-pad']);
    expect(report.used).toEqual([]);
    expect(report.scannedFiles).toBe(1);
  });
});

describe('cli: local protocol dependencies', () => {
  const fixture = resolve(__dirname, '..', 'fixtures', 'local-protocols');

  it('ignores local package names without hiding unrelated dependencies', () => {
    const result = runCli(['--format', 'json'], fixture);
    const report = JSON.parse(result.stderr || result.stdout);

    expect(result.code).toBe(1);
    expect(report.unused).toEqual(['lodash', 'vitest']);
    expect(report.ignored).toEqual([
      'local-file',
      'local-link',
      'local-workspace',
    ]);
  });
});

describe('cli: error cases', () => {
  it('exits 2 for unknown format', () => {
    const fixture = resolve(__dirname, '..', 'fixtures', 'all-clean');
    const result = runCli(['--format', 'xml'], fixture);
    expect(result.code).toBe(2);
    const output = result.stderr;
    expect(output).toContain('unknown format');
  });

  it('exits 1 for nonexistent dir', () => {
    const missingDir = join(tmpdir(), `unuseddeps-missing-${process.pid}`);
    const fixture = resolve(__dirname, '..', 'fixtures', 'all-clean');
    const result = runCli([missingDir], fixture);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(`Error: cannot read ${join(missingDir, 'package.json')}`);
  });

  it('reports a non-string dependency range without a stack trace', () => {
    const project = mkdtempSync(join(tmpdir(), 'unuseddeps-malformed-'));
    try {
      writeFileSync(join(project, 'package.json'), JSON.stringify({
        name: 'probe',
        dependencies: { broken: 42 },
      }));
      writeFileSync(join(project, 'index.js'), 'export {};\n');

      const result = runCli(['--no-include-dev', '--no-color'], project);

      expect(result.code).toBe(1);
      expect(result.stderr).toBe(
        'Error: Invalid package.json: "dependencies.broken" must be a string range\n',
      );
      expect(result.stderr).not.toContain('at ');
    } finally {
      rmSync(project, { recursive: true, force: true });
    }
  });
});

describe('cli: help', () => {
  it('outputs help text', () => {
    const result = runCli(['--help'], '/tmp');
    const output = result.stdout || result.stderr;
    expect(output).toContain('unuseddeps');
    expect(output).toContain('--ignore');
    expect(output).toContain('--format');
    expect(output).toContain('--include-dev');
    expect(output).toContain('dependency sections must be objects with string version ranges');
  });

  it('shows version', () => {
    const result = runCli(['--version'], '/tmp');
    const output = result.stdout || result.stderr;
    expect(output).toMatch(/\d+\.\d+\.\d+/);
  });
});
