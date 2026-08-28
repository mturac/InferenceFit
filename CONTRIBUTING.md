# Contributing to InferenceFit

```bash
git clone https://github.com/mturac/InferenceFit.git
cd InferenceFit
npm ci --ignore-scripts
npm run verify
```

Changes to metrics, eligibility, utility scoring, or schemas require a failing test first and an explanation of the decision impact. Keep evaluation deterministic and metadata-only. Do not add model calls, provider-specific network lookups, prompt storage, or hidden weighting.
