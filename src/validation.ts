import { InferenceFitError } from './errors.js';
import type { RunRecord, RunSuite } from './types.js';

const suiteKeys = new Set(['schemaVersion', 'suite', 'runs']);
const metadataKeys = new Set(['id', 'repository', 'description']);
const runKeys = new Set([
  'taskId',
  'model',
  'attemptId',
  'verified',
  'durationMs',
  'costUsd',
  'patch',
  'scopeEscapes',
  'falseCompletion',
  'testPassRate',
  'toolErrors'
]);
const patchKeys = new Set(['files', 'additions', 'deletions']);

function exactKeys(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new InferenceFitError('INVALID_SUITE', `${label} contains unsupported field: ${key}`);
  }
}

function finiteNonNegative(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new InferenceFitError('INVALID_SUITE', `${label} must be a finite non-negative number.`);
  }
  return value;
}

function parseRun(value: unknown, index: number): RunRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InferenceFitError('INVALID_SUITE', `runs[${index}] must be an object.`);
  }
  const run = value as Record<string, unknown>;
  exactKeys(run, runKeys, `runs[${index}]`);

  for (const field of ['taskId', 'model', 'attemptId']) {
    if (typeof run[field] !== 'string' || !(run[field] as string).trim()) {
      throw new InferenceFitError('INVALID_SUITE', `runs[${index}].${field} is required.`);
    }
  }
  if (typeof run.verified !== 'boolean' || typeof run.falseCompletion !== 'boolean') {
    throw new InferenceFitError('INVALID_SUITE', `runs[${index}] boolean fields are invalid.`);
  }
  if (!run.patch || typeof run.patch !== 'object' || Array.isArray(run.patch)) {
    throw new InferenceFitError('INVALID_SUITE', `runs[${index}].patch is invalid.`);
  }

  const patch = run.patch as Record<string, unknown>;
  exactKeys(patch, patchKeys, `runs[${index}].patch`);
  const record: RunRecord = {
    taskId: (run.taskId as string).trim(),
    model: (run.model as string).trim(),
    attemptId: (run.attemptId as string).trim(),
    verified: run.verified,
    durationMs: finiteNonNegative(run.durationMs, `runs[${index}].durationMs`),
    costUsd: finiteNonNegative(run.costUsd, `runs[${index}].costUsd`),
    patch: {
      files: finiteNonNegative(patch.files, `runs[${index}].patch.files`),
      additions: finiteNonNegative(patch.additions, `runs[${index}].patch.additions`),
      deletions: finiteNonNegative(patch.deletions, `runs[${index}].patch.deletions`)
    },
    scopeEscapes: finiteNonNegative(run.scopeEscapes, `runs[${index}].scopeEscapes`),
    falseCompletion: run.falseCompletion
  };

  if (run.testPassRate !== undefined) record.testPassRate = finiteNonNegative(run.testPassRate, `runs[${index}].testPassRate`);
  if (run.toolErrors !== undefined) record.toolErrors = finiteNonNegative(run.toolErrors, `runs[${index}].toolErrors`);
  return record;
}

export function parseRunSuite(value: unknown): RunSuite {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InferenceFitError('INVALID_SUITE', 'Suite must be an object.');
  }

  const suite = value as Record<string, unknown>;
  exactKeys(suite, suiteKeys, 'suite');
  if (suite.schemaVersion !== '1' || !suite.suite || typeof suite.suite !== 'object' || Array.isArray(suite.suite) || !Array.isArray(suite.runs)) {
    throw new InferenceFitError('INVALID_SUITE', 'Suite shape is invalid.');
  }

  const metadata = suite.suite as Record<string, unknown>;
  exactKeys(metadata, metadataKeys, 'suite metadata');
  if (typeof metadata.id !== 'string' || typeof metadata.repository !== 'string' || !metadata.id.trim() || !metadata.repository.trim()) {
    throw new InferenceFitError('INVALID_SUITE', 'Suite id and repository are required.');
  }

  const parsed: RunSuite = {
    schemaVersion: '1',
    suite: { id: metadata.id.trim(), repository: metadata.repository.trim() },
    runs: suite.runs.map(parseRun)
  };
  if (typeof metadata.description === 'string') parsed.suite.description = metadata.description;
  return parsed;
}
