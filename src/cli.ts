import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { evaluateSuite } from './evaluate.js';
import { compareEvaluations } from './compare.js';
import { renderComparisonMarkdown, renderEvaluationMarkdown } from './render.js';
import { InferenceFitError } from './errors.js';
import type { EvaluationPolicy, EvaluationReport } from './types.js';

const VERSION = '0.1.0';

function help(): string {
  return `InferenceFit ${VERSION}\n\nUsage:\n  inferencefit evaluate <suite.json> [--out report.json] [--markdown report.md] [quality floors]\n  inferencefit recommend <report.json>\n  inferencefit compare <baseline.json> <candidate.json> [--out comparison.json] [--markdown comparison.md]\n  inferencefit --version\n\nQuality floors:\n  --min-success <0..1> --max-scope-escape <0..1> --max-false-completion <0..1>\n  --max-median-ms <number> --max-cost-per-success <usd>\n`;
}

function parse(args: string[]): { command: string; positionals: string[]; options: Map<string, string> } {
  const command = args.shift() ?? 'help';
  const positionals: string[] = [];
  const options = new Map<string, string>();
  while (args.length) {
    const token = args.shift()!;
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    if (!['--out', '--markdown', '--min-success', '--max-scope-escape', '--max-false-completion', '--max-median-ms', '--max-cost-per-success'].includes(token)) {
      throw new InferenceFitError('UNKNOWN_OPTION', `Unknown option: ${token}`);
    }
    const value = args.shift();
    if (!value || value.startsWith('--')) throw new InferenceFitError('OPTION_VALUE_REQUIRED', `${token} requires a value.`);
    options.set(token, value);
  }
  return { command, positionals, options };
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeOutput(path: string | undefined, content: string): Promise<void> {
  if (!path) {
    process.stdout.write(content);
    return;
  }
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, 'utf8');
}

function policy(options: Map<string, string>): EvaluationPolicy {
  return {
    minSuccessRate: Number(options.get('--min-success') ?? 0.7),
    maxScopeEscapeRate: Number(options.get('--max-scope-escape') ?? 0.1),
    maxFalseCompletionRate: Number(options.get('--max-false-completion') ?? 0.05),
    maxMedianDurationMs: Number(options.get('--max-median-ms') ?? Number.MAX_SAFE_INTEGER),
    maxCostPerVerifiedSuccess: Number(options.get('--max-cost-per-success') ?? Number.MAX_SAFE_INTEGER)
  };
}

export async function runCli(argv: string[]): Promise<number> {
  if (!argv.length || argv[0] === '--help' || argv[0] === 'help') {
    process.stdout.write(help());
    return 0;
  }
  if (argv[0] === '--version') {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  const parsed = parse([...argv]);
  if (parsed.command === 'evaluate') {
    const path = parsed.positionals[0];
    if (!path) throw new InferenceFitError('PATH_REQUIRED', 'Suite path is required.');
    const report = evaluateSuite(await readJson(path), policy(parsed.options));
    await writeOutput(parsed.options.get('--out'), `${JSON.stringify(report, null, 2)}\n`);
    if (parsed.options.has('--markdown')) await writeOutput(parsed.options.get('--markdown'), renderEvaluationMarkdown(report));
    return report.recommendation ? 0 : 2;
  }

  if (parsed.command === 'recommend') {
    const path = parsed.positionals[0];
    if (!path) throw new InferenceFitError('PATH_REQUIRED', 'Report path is required.');
    const report = await readJson(path) as EvaluationReport;
    process.stdout.write(`${report.recommendation?.model ?? 'NO_ELIGIBLE_MODEL'}\n`);
    return report.recommendation ? 0 : 2;
  }

  if (parsed.command === 'compare') {
    const [baselinePath, candidatePath] = parsed.positionals;
    if (!baselinePath || !candidatePath) throw new InferenceFitError('PATH_REQUIRED', 'Baseline and candidate report paths are required.');
    const comparison = compareEvaluations(
      await readJson(baselinePath) as EvaluationReport,
      await readJson(candidatePath) as EvaluationReport
    );
    await writeOutput(parsed.options.get('--out'), `${JSON.stringify(comparison, null, 2)}\n`);
    if (parsed.options.has('--markdown')) await writeOutput(parsed.options.get('--markdown'), renderComparisonMarkdown(comparison));
    return 0;
  }

  throw new InferenceFitError('UNKNOWN_COMMAND', `Unknown command: ${parsed.command}`);
}
