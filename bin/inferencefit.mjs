#!/usr/bin/env node
import { runCli } from '../dist/cli.js';
import { InferenceFitError } from '../dist/errors.js';

try {
  process.exitCode = await runCli(process.argv.slice(2));
} catch (error) {
  const payload = error instanceof InferenceFitError
    ? { error: { code: error.code, message: error.message, details: error.details } }
    : { error: { code: 'UNEXPECTED_ERROR', message: error instanceof Error ? error.message : String(error) } };
  process.stderr.write(`${JSON.stringify(payload)}\n`);
  process.exitCode = 1;
}
