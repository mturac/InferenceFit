export interface PatchMetrics {
  files: number;
  additions: number;
  deletions: number;
}

export interface RunRecord {
  taskId: string;
  model: string;
  attemptId: string;
  verified: boolean;
  durationMs: number;
  costUsd: number;
  patch: PatchMetrics;
  scopeEscapes: number;
  falseCompletion: boolean;
  testPassRate?: number;
  toolErrors?: number;
}

export interface RunSuite {
  schemaVersion: '1';
  suite: { id: string; repository: string; description?: string };
  runs: RunRecord[];
}

export interface EvaluationPolicy {
  minSuccessRate?: number;
  maxScopeEscapeRate?: number;
  maxFalseCompletionRate?: number;
  maxMedianDurationMs?: number;
  maxCostPerVerifiedSuccess?: number;
}

export interface ModelEvaluation {
  model: string;
  attempts: number;
  tasks: number;
  verifiedSuccesses: number;
  successRate: number;
  medianDurationMs: number;
  totalCostUsd: number;
  costPerVerifiedSuccess: number | null;
  medianPatchSize: number;
  scopeEscapeRate: number;
  falseCompletionRate: number;
  medianTestPassRate: number | null;
  eligible: boolean;
  failedFloors: string[];
  utilityScore: number;
}

export interface EvaluationReport {
  schemaVersion: '1';
  generator: { name: 'InferenceFit'; version: string };
  suite: RunSuite['suite'];
  policy: Required<EvaluationPolicy>;
  models: ModelEvaluation[];
  recommendation: { model: string; reason: string } | null;
  reportHash: string;
}

export interface EvaluationComparison {
  schemaVersion: '1';
  baselineHash: string;
  candidateHash: string;
  recommendationChanged: boolean;
  baselineRecommendation: string | null;
  candidateRecommendation: string | null;
  modelDeltas: Array<{
    model: string;
    successRateDelta: number;
    costPerVerifiedSuccessDelta: number | null;
    utilityScoreDelta: number;
  }>;
  comparisonHash: string;
}
