import type { EvaluationComparison, EvaluationReport } from './types.js';

function money(value: number | null): string {
  return value === null ? 'n/a' : `$${value.toFixed(4)}`;
}

export function renderEvaluationMarkdown(report: EvaluationReport): string {
  const lines = [
    '# InferenceFit Evaluation',
    '',
    `**Suite:** ${report.suite.id}`,
    `**Repository:** ${report.suite.repository}`,
    `**Report hash:** \`${report.reportHash}\``,
    '',
    report.recommendation
      ? `**Recommendation:** ${report.recommendation.model} — ${report.recommendation.reason}`
      : '**Recommendation:** none; no model passed every quality floor.',
    '',
    '| Model | Eligible | Verified | Success | Median time | Cost / verified | Scope escapes | False completion | Utility |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ...report.models.map(model => `| ${model.model} | ${model.eligible ? 'yes' : 'no'} | ${model.verifiedSuccesses}/${model.attempts} | ${(model.successRate * 100).toFixed(1)}% | ${model.medianDurationMs} ms | ${money(model.costPerVerifiedSuccess)} | ${(model.scopeEscapeRate * 100).toFixed(1)}% | ${(model.falseCompletionRate * 100).toFixed(1)}% | ${model.utilityScore} |`),
    ''
  ];

  for (const model of report.models.filter(item => !item.eligible)) {
    lines.push(`- **${model.model}** failed: ${model.failedFloors.join(', ')}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderComparisonMarkdown(comparison: EvaluationComparison): string {
  const lines = [
    '# InferenceFit Comparison',
    '',
    `Baseline: \`${comparison.baselineHash}\``,
    `Candidate: \`${comparison.candidateHash}\``,
    `Recommendation changed: ${comparison.recommendationChanged ? 'yes' : 'no'}`,
    '',
    '| Model | Success Δ | Cost / verified Δ | Utility Δ |',
    '|---|---:|---:|---:|',
    ...comparison.modelDeltas.map(delta => `| ${delta.model} | ${delta.successRateDelta} | ${delta.costPerVerifiedSuccessDelta ?? 'n/a'} | ${delta.utilityScoreDelta} |`),
    '',
    `Comparison hash: \`${comparison.comparisonHash}\``
  ];
  return `${lines.join('\n')}\n`;
}
