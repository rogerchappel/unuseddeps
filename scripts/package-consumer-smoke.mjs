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

  console.log(`packed consumer smoke passed on Node ${process.version} with engine-strict`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}
