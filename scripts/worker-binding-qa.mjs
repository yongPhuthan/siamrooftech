#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
const target = process.argv[2] || 'staging';
const environment = config.env?.[target];
assert.ok(environment, `Missing Wrangler environment ${target}`);
const worker = await readFile('.open-next/worker.js', 'utf8');
const migrations = config.migrations || [];
const bindings = environment.durable_objects?.bindings || [];
assert.ok(bindings.length, `${target} must declare the OpenNext durable-object bindings`);
for (const binding of bindings) {
  const importLine = worker.split('\n').find((line) => line.includes(`export { ${binding.class_name} } from `));
  assert.ok(importLine, `Worker entry does not export ${binding.class_name}`);
  const relativeModule = importLine.match(/from\s+["']([^"']+)["']/)?.[1];
  assert.ok(relativeModule, `Cannot resolve ${binding.class_name} export module`);
  const resolved = resolve('.open-next', relativeModule);
  assert.ok((await stat(resolved)).isFile(), `Worker module for ${binding.class_name} is missing`);
  const source = await readFile(resolved, 'utf8');
  assert.match(source, new RegExp(`(?:var|const|class)\\s+${binding.class_name}\\s*=\\s*class\\s+extends\\s+DurableObject`), `${binding.class_name} is not a DurableObject implementation`);
  assert.ok(migrations.some((migration) => migration.new_sqlite_classes?.includes(binding.class_name)), `No migration registers Durable Object class ${binding.class_name}`);
}
console.log(`Worker binding QA passed for ${target}: ${bindings.map((binding) => binding.class_name).join(', ')} are exported, bundled, and registered.`);
