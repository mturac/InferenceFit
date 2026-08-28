import { canonicalJson, sha256 } from './canonical.js';
import { median, rate, round } from './stats.js';
import { parseRunSuite } from './validation.js';
import type { EvaluationPolicy, EvaluationReport, ModelEvaluation, RunRecord, RunSuite } from './types.js';

const VERSION = '0.1.0';
const DEFAULT_POLICY: Required<EvaluationPolicy> = {
  minSuccessRate: 0.7,
  maxScopeEscapeRate: 0.1,
  maxFalseCompletionRate: 0.05,
  maxMedianDurationMs: Number.MAX_SAFE_INTEGER,
  maxCostPerVerifiedSuccess: Number.MAX_SAFE_INTEGER
};

function evaluateModel(model: string, runs: RunRecord[], policy: Required<EvaluationPolicy>): ModelEvaluation {
  const attempts = runs.length;
  const verifiedSuccesses = runs.filter(run => run.verified).length;
  const successRate = rate(verifiedSuccesses, attempts);
  const totalCostUsd = round(runs.reduce((sum, run) => sum + run.costUsd, 0));
  const costPerVerifiedSuccess = verifiedSuccesses ? round(totalCostUsd / verifiedSuccesses) : null;
  const medianDurationMs = median(runs.map(run => run.durationMs));
  const medianPatchSize = median(runs.map(run => run.patch.additions + run.patch.deletions));
  const scopeEscapeRate = rate(runs.filter(run => run.scopeEscapes > 0).length, attempts);
  const falseCompletionRate = rate(runs.filter(run => run.falseCompletion).length, attempts);
  const testRates = runs.flatMap(run => run.testPassRate === undefined ? [] : [run.testPassRate]);
  const medianTestPassRate = testRates.length ? median(testRates) : null;
  const failedFloors: string[] = [];

  if (successRate < policy.minSuccessRate) failedFloors.push(`successRate<${policy.minSuccessRate}`);
  if (scopeEscapeRate > policy.maxScopeEscapeRate) failedFloors.push(`scopeEscapeRate>${policy.maxScopeEscapeRate}`);
  if (falseCompletionRate > policy.maxFalseCompletionRate) failedFloors.push(`falseCompletionRate>${policy.maxFalseCompletionRate}`);
  if (medianDurationMs > policy.maxMedianDurationMs) failedFloors.push(`medianDurationMs>${policy.maxMedianDurationMs}`);
  if (costPerVerifiedSuccess === null || costPerVerifiedSuccess > policy.maxCostPerVerifiedSuccess) {
    failedFloors.push(`costPerVerifiedSuccess>${policy.maxCostPerVerifiedSuccess}`);
  }

  const utilityScore = round(
    successRate * 100 -
    falseCompletionRate * 40 -
    scopeEscapeRate * 30 -
    Math.log10(Math.max(1, medianDurationMs)) * 2 -
    (costPerVerifiedSuccess ?? totalCostUsd) * 10 -
    medianPatchSize / 500
  );

  return {
    model,
    attempts,
    tasks: new Set(runs.map(run => run.taskId)).size,
    verifiedSuccesses,
    successRate,
    medianDurationMs,
    totalCostUsd,
    costPerVerifiedSuccess,
    medianPatchSize,
    scopeEscapeRate,
    falseCompletionRate,
    medianTestPassRate,
    eligible: failedFloors.length === 0,
    failedFloors,
    utilityScore
  };
}

export function evaluateSuite(input: RunSuite | unknown, policyInput: EvaluationPolicy = {}): EvaluationReport {
  const suite = parseRunSuite(input);
  const policy = { ...DEFAULT_POLICY, ...policyInput };
  const groups = new Map<string, RunRecord[]>();
  for (const run of suite.runs) groups.set(run.model, [...(groups.get(run.model) ?? []), run]);

  const models = [...groups]
    .map(([model, runs]) => evaluateModel(model, runs, policy))
    .sort((left, right) => Number(right.eligible) - Number(left.eligible) || right.utilityScore - left.utilityScore || left.model.localeCompare(right.model));
  const winner = models.find(model => model.eligible) ?? null;
  const withoutHash = {
    schemaVersion: '1' as const,
    generator: { name: 'InferenceFit' as const, version: VERSION },
    suite: suite.suite,
    policy,
    models,
    recommendation: winner
      ? { model: winner.model, reason: `Highest utility score among models that passed every quality floor (${winner.utilityScore}).` }
      : null
  };
  return { ...withoutHash, reportHash: sha256(canonicalJson(withoutHash)) };
}
