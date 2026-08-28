import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const pack = JSON.parse(execFileSync('npm', ['pack', '--json'], { cwd: root, encoding: 'utf8' }))[0];
const files = new Set(pack.files.map(file => file.path));
for (const required of ['bin/inferencefit.mjs', 'dist/index.js', 'dist/index.d.ts', 'schema/inferencefit-suite.schema.json', 'schema/inferencefit-report.schema.json', 'README.md', 'LICENSE']) {
  if (!files.has(required)) throw new Error(`Package missing ${required}`);
}
for (const forbidden of ['src/evaluate.ts', 'test/evaluate.test.mjs', '.github/workflows/ci.yml']) {
  if (files.has(forbidden)) throw new Error(`Package leaked ${forbidden}`);
}

const consumer = await mkdtemp(join(tmpdir(), 'inferencefit-consumer-'));
await writeFile(join(consumer, 'package.json'), '{"type":"module"}\n');
execFileSync('npm', ['install', '--ignore-scripts', join(new URL('.', root).pathname, pack.filename)], { cwd: consumer, stdio: 'pipe' });
await writeFile(join(consumer, 'smoke.mjs'), `import {evaluateSuite} from '@mturac/inferencefit';const r=evaluateSuite({schemaVersion:'1',suite:{id:'x',repository:'r'},runs:[]});if(!r.reportHash)throw new Error('missing hash');`);
execFileSync(process.execPath, ['smoke.mjs'], { cwd: consumer, stdio: 'pipe' });
const cli = spawnSync(join(consumer, 'node_modules', '.bin', 'inferencefit'), ['--version'], { cwd: consumer, encoding: 'utf8' });
if (cli.status !== 0 || !cli.stdout.includes('0.1.0')) throw new Error(cli.stderr);
process.stdout.write(`Package verified: ${pack.filename}, ${files.size} files.\n`);
