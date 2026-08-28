# InferenceFit

<p align="center">
  <img src="docs/assets/inferencefit-hero.png" alt="InferenceFit — evidence-based model selection for coding tasks" width="100%" />
</p>

[![CI](https://github.com/mturac/InferenceFit/actions/workflows/ci.yml/badge.svg)](https://github.com/mturac/InferenceFit/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933.svg)](package.json)
[![Zero runtime dependencies](https://img.shields.io/badge/runtime_dependencies-0-success.svg)](package.json)

**InferenceFit selects models for coding work using verified repository outcomes—not generic leaderboard scores.**

A cheap model is expensive when it retries, escapes scope, produces false completion, or needs another model to repair the patch. A powerful model is wasteful when a smaller one passes the same product-specific quality floor. InferenceFit converts task-run receipts into a deterministic tournament report and recommends only among models that clear every declared quality floor.

```text
repository task runs
        ↓
strict metadata-only normalization
        ↓
verified completion · time · cost · patch shape
        ↓
hard quality floors
        ↓
eligible-model ranking
        ↓
recommendation + sealed report
```

InferenceFit does not call models, run agents, or scrape leaderboards. You bring the evidence; it performs the same evaluation every time.

## Quick start

```bash
git clone https://github.com/mturac/InferenceFit.git
cd InferenceFit
npm ci --ignore-scripts
npm run build
```

Evaluate a suite:

```bash
node bin/inferencefit.mjs evaluate examples/repo-suite.json \
  --min-success 0.80 \
  --max-scope-escape 0.05 \
  --max-false-completion 0.02 \
  --out .inferencefit/report.json \
  --markdown .inferencefit/report.md
```

Print the recommendation for automation:

```bash
node bin/inferencefit.mjs recommend .inferencefit/report.json
```

Compare two evaluation reports:

```bash
node bin/inferencefit.mjs compare baseline.json candidate.json \
  --out comparison.json \
  --markdown comparison.md
```

Exit codes:

- `0` — evaluation completed and at least one model is eligible;
- `2` — evaluation completed but no model passed all quality floors;
- `1` — invalid evidence or operational failure.

## Evidence model

A run record contains no prompt or completion text:

```json
{
  "taskId": "billing-webhook-04",
  "model": "model-a",
  "attemptId": "run-017",
  "verified": true,
  "durationMs": 183200,
  "costUsd": 0.42,
  "patch": { "files": 7, "additions": 184, "deletions": 37 },
  "scopeEscapes": 0,
  "falseCompletion": false,
  "testPassRate": 1
}
```

Unknown fields are rejected. This prevents raw prompts, hidden reasoning, completion text, or arbitrary provider payloads from silently entering the evidence contract.

## Metrics

For each model, InferenceFit computes:

- verified success rate;
- median completion time;
- total cost and **cost per verified success**;
- median patch size;
- scope-escape rate;
- false-completion rate;
- median test pass rate when supplied;
- deterministic utility score;
- exact failed quality floors.

The recommendation is the highest-utility model among eligible models only. Ineligible models never win because they are cheaper or faster.

## Quality floors

Defaults:

| Floor | Default |
|---|---:|
| Minimum verified success rate | `0.70` |
| Maximum scope-escape rate | `0.10` |
| Maximum false-completion rate | `0.05` |
| Maximum median duration | unbounded |
| Maximum cost per verified success | unbounded |

Override them for your repository and risk profile:

```bash
--min-success 0.90
--max-scope-escape 0
--max-false-completion 0
--max-median-ms 600000
--max-cost-per-success 1.25
```

A high-risk migration suite should use stricter floors than a low-risk documentation suite.

## Why verified outcomes

Generic benchmarks answer broad questions about a model family. They do not prove that a model can modify your repository, respect your boundaries, use your tools, complete your browser journey, or survive your verification gates.

InferenceFit is designed around task suites drawn from real repository work. It rewards completion that is independently verified and penalizes delivery behaviors that transfer cost to reviewers and repair agents.

## CLI

```text
inferencefit evaluate <suite.json>
  [--out <report.json>]
  [--markdown <report.md>]
  [--min-success <0..1>]
  [--max-scope-escape <0..1>]
  [--max-false-completion <0..1>]
  [--max-median-ms <number>]
  [--max-cost-per-success <usd>]

inferencefit recommend <report.json>
inferencefit compare <baseline.json> <candidate.json>
  [--out <comparison.json>]
  [--markdown <comparison.md>]

inferencefit --version
inferencefit --help
```

## Library API

```ts
import {
  evaluateSuite,
  compareEvaluations,
  renderEvaluationMarkdown,
  type EvaluationPolicy,
  type RunSuite
} from "@mturac/inferencefit";

const policy: EvaluationPolicy = {
  minSuccessRate: 0.85,
  maxScopeEscapeRate: 0.05,
  maxFalseCompletionRate: 0.02
};

const report = evaluateSuite(suite satisfies RunSuite, policy);
console.log(report.recommendation);
console.log(renderEvaluationMarkdown(report));
```

## Integrations

InferenceFit can consume normalized receipts produced by your own harness. The surrounding tool suite provides useful evidence sources:

- [InferShape](https://github.com/mturac/InferShape) diagnoses session waste and failure patterns;
- [PatchLens](https://github.com/mturac/PatchLens) reports scope and change-risk evidence;
- [VibeProof](https://github.com/mturac/VibeProof) independently verifies the running product;
- [RepoPack](https://github.com/mturac/RepoPack) standardizes task-specific repository context.

Adapters should translate those artifacts into the strict `RunRecord` schema rather than embedding arbitrary source or model content.

## Privacy and reproducibility

InferenceFit is local-only, makes zero network calls, and has zero runtime dependencies. Report and comparison hashes use canonical JSON and SHA-256. The same suite, policy, and version produce the same result.

Identifiers and repository names may still be sensitive. Pseudonymize them before publishing a dataset.

## Scope and non-goals

InferenceFit does not execute models, verify products itself, estimate unreported provider costs, normalize currency or hardware prices, infer statistical significance from tiny samples, or guarantee future model behavior. A recommendation is only as good as the suite coverage and evidence quality behind it.

## Development

```bash
npm ci --ignore-scripts
npm run verify
```

Verification covers strict validation, deterministic aggregation, cost-per-verified-success math, quality floors, comparisons, CLI behavior, public types, schemas, PNG checks, and a real npm consumer install/import/CLI smoke test.

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
