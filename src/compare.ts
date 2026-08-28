import { canonicalJson, sha256 } from './canonical.js';
import { round } from './stats.js';
import type { EvaluationComparison, EvaluationReport } from './types.js';

export function compareEvaluations(baseline: EvaluationReport, candidate: EvaluationReport): EvaluationComparison {
  const names = [...new Set([...baseline.models.map(model => model.model), ...candidate.models.map(model => model.model)])].sort();
  const modelDeltas = names.map(model => {
    const before = baseline.models.find(item => item.model === model);
    const after = candidate.models.find(item => item.model === model);
    return {
      model,
      successRateDelta: round((after?.successRate ?? 0) - (before?.successRate ?? 0)),
      costPerVerifiedSuccessDelta:
        after?.costPerVerifiedSuccess === null ||
        before?.costPerVerifiedSuccess === null ||
        after?.costPerVerifiedSuccess === undefined ||
        before?.costPerVerifiedSuccess === undefined
          ? null
          : round(after.costPerVerifiedSuccess - before.costPerVerifiedSuccess),
      utilityScoreDelta: round((after?.utilityScore ?? 0) - (before?.utilityScore ?? 0))
    };
  });

  const withoutHash = {
    schemaVersion: '1' as const,
    baselineHash: baseline.reportHash,
    candidateHash: candidate.reportHash,
    recommendationChanged: baseline.recommendation?.model !== candidate.recommendation?.model,
    baselineRecommendation: baseline.recommendation?.model ?? null,
    candidateRecommendation: candidate.recommendation?.model ?? null,
    modelDeltas
  };
  return { ...withoutHash, comparisonHash: sha256(canonicalJson(withoutHash)) };
}
