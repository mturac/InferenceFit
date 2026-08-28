import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRunSuite, InferenceFitError } from '../dist/index.js';

test('rejects prompts and unknown fields from evidence records', () => {
  assert.throws(
    () => parseRunSuite({
      schemaVersion: '1',
      suite: { id: 'x', repository: 'r' },
      runs: [{
        taskId: 't', model: 'm', attemptId: 'a', verified: true, durationMs: 1, costUsd: 0,
        patch: { files: 1, additions: 1, deletions: 0 }, scopeEscapes: 0, falseCompletion: false,
        prompt: 'secret'
      }]
    }),
    error => error instanceof InferenceFitError && error.code === 'INVALID_SUITE'
  );
});
