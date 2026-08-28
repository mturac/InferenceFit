import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSuite, compareEvaluations } from '../dist/index.js';

const suite = {
  schemaVersion: '1',
  suite: { id: 'billing-repo-v1', repository: 'payments-api' },
  runs: [
    { taskId: 't1', model: 'model-a', attemptId: 'a1', verified: true, durationMs: 1000, costUsd: 0.2, patch: { files: 2, additions: 40, deletions: 8 }, scopeEscapes: 0, falseCompletion: false },
    { taskId: 't2', model: 'model-a', attemptId: 'a2', verified: true, durationMs: 1400, costUsd: 0.25, patch: { files: 3, additions: 52, deletions: 10 }, scopeEscapes: 0, falseCompletion: false },
    { taskId: 't1', model: 'model-b', attemptId: 'b1', verified: false, durationMs: 500, costUsd: 0.05, patch: { files: 6, additions: 90, deletions: 12 }, scopeEscapes: 1, falseCompletion: true },
    { taskId: 't2', model: 'model-b', attemptId: 'b2', verified: true, durationMs: 700, costUsd: 0.07, patch: { files: 5, additions: 80, deletions: 9 }, scopeEscapes: 0, falseCompletion: false }
  ]
};

test('recommends model that clears quality floors by verified outcome', () => {
  const report = evaluateSuite(suite, { minSuccessRate: 0.75, maxScopeEscapeRate: 0.1, maxFalseCompletionRate: 0.1 });
  assert.equal(report.recommendation?.model, 'model-a');
  assert.equal(report.models.find(model => model.model === 'model-a')?.eligible, true);
  assert.equal(report.models.find(model => model.model === 'model-b')?.eligible, false);
  assert.match(report.reportHash, /^[a-f0-9]{64}$/);
});

test('computes cost per verified success rather than raw request cost', () => {
  const report = evaluateSuite(suite);
  assert.equal(report.models.find(model => model.model === 'model-a')?.costPerVerifiedSuccess, 0.225);
});

test('same input yields same sealed report', () => {
  assert.equal(evaluateSuite(suite).reportHash, evaluateSuite(suite).reportHash);
});

test('comparison identifies recommendation changes and score deltas', () => {
  const baseline = evaluateSuite(suite);
  const candidate = evaluateSuite({
    ...suite,
    suite: { ...suite.suite, id: 'candidate' },
    runs: suite.runs.filter(run => run.model === 'model-b').map(run => ({ ...run, verified: true, falseCompletion: false, scopeEscapes: 0 }))
  });
  const comparison = compareEvaluations(baseline, candidate);
  assert.equal(comparison.recommendationChanged, true);
  assert.match(comparison.comparisonHash, /^[a-f0-9]{64}$/);
});
