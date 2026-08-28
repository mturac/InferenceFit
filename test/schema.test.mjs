import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('schemas are strict and versioned', async () => {
  for (const file of ['inferencefit-suite.schema.json', 'inferencefit-report.schema.json']) {
    const schema = JSON.parse(await readFile(new URL(`../schema/${file}`, import.meta.url), 'utf8'));
    assert.equal(schema.additionalProperties, false);
    assert.match(schema.$id, /github.com\/mturac\/InferenceFit/);
  }
});
