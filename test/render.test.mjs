import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSuite, renderEvaluationMarkdown } from '../dist/index.js';

test('renders recommendation and quality evidence', () => {
  const report = evaluateSuite({
    schemaVersion: '1',
    suite: { id: 'x', repository: 'r' },
    runs: [{
      taskId: 't', model: 'm', attemptId: 'a', verified: true, durationMs: 10, costUsd: 0.1,
      patch: { files: 1, additions: 2, deletions: 1 }, scopeEscapes: 0, falseCompletion: false
    }]
  });
  const markdown = renderEvaluationMarkdown(report);
  assert.match(markdown, /InferenceFit Evaluation/);
  assert.match(markdown, /Recommendation.*m/);
});
