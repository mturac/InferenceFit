import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('CLI evaluates and writes machine and human reports', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'inferencefit-cli-'));
  const suitePath = join(directory, 'suite.json');
  const reportPath = join(directory, 'report.json');
  const markdownPath = join(directory, 'report.md');
  await writeFile(suitePath, JSON.stringify({
    schemaVersion: '1',
    suite: { id: 'x', repository: 'r' },
    runs: [{
      taskId: 't', model: 'm', attemptId: 'a', verified: true, durationMs: 10, costUsd: 0.1,
      patch: { files: 1, additions: 2, deletions: 1 }, scopeEscapes: 0, falseCompletion: false
    }]
  }));
  const run = spawnSync(process.execPath, ['bin/inferencefit.mjs', 'evaluate', suitePath, '--out', reportPath, '--markdown', markdownPath], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(await readFile(reportPath, 'utf8')).recommendation.model, 'm');
  assert.match(await readFile(markdownPath, 'utf8'), /InferenceFit Evaluation/);
});
