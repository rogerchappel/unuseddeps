import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: 'pipe',
    ...options,
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    process.exit(result.status || 1);
  }

  return result.stdout;
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const workspace = mkdtempSync(resolve(tmpdir(), 'unuseddeps-consumer-'));

try {
  const packOutput = run('npm', ['pack', '--json', '--pack-destination', workspace]);
  const [packument] = JSON.parse(packOutput);
  const tarball = resolve(workspace, packument.filename);
  const consumer = resolve(workspace, 'consumer');

  mkdirSync(consumer);
  writeFileSync(
    resolve(consumer, 'package.json'),
    `${JSON.stringify({ private: true }, null, 2)}\n`,
  );

  run('npm', ['install', '--engine-strict', '--prefix', consumer, tarball]);

  const cli = resolve(consumer, 'node_modules', '.bin', 'unuseddeps');
  const version = run(cli, ['--version'], { cwd: consumer }).trim();

  if (version !== packageJson.version) {
    console.error(`packed consumer reported version ${version}; expected ${packageJson.version}`);
    process.exit(1);
  }

  const fixture = resolve(workspace, 'fixture');
  mkdirSync(fixture);
  writeFileSync(
    resolve(fixture, 'package.json'),
    `${JSON.stringify({ dependencies: { '@scope/tool': '1.0.0', axios: '1.0.0', lodash: '1.0.0' } }, null, 2)}\n`,
  );
  writeFileSync(
    resolve(fixture, 'index.cjs'),
    `const name = 'axios';\nrequire.resolve('lodash/fp');\nrequire.resolve('@scope/tool/runtime');\nrequire.resolve(name);\nresolver.resolve('axios');\n`,
  );

  const scan = spawnSync(cli, [fixture, '--format', 'json', '--no-color'], {
    encoding: 'utf8',
    stdio: 'pipe',
  });
  const report = JSON.parse(scan.stdout);

  if (
    scan.status !== 1 ||
    JSON.stringify(report.used) !== JSON.stringify(['@scope/tool', 'lodash']) ||
    JSON.stringify(report.unused) !== JSON.stringify(['axios'])
  ) {
    process.stderr.write(scan.stderr ?? '');
    console.error(`packed consumer require.resolve scan failed: ${scan.stdout}`);
    process.exit(1);
  }

  console.log(`packed consumer smoke passed on Node ${process.version} with engine-strict and require.resolve coverage`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
