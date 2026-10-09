import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { parse } from 'yaml';

const files = (await readdir('.github/workflows')).filter((file) => /\.ya?ml$/.test(file));
assert.ok(files.length > 0, 'At least one CI workflow must be checked in');
const workflows = new Map();
for (const file of files) {
  const source = await readFile(`.github/workflows/${file}`, 'utf8');
  assert.doesNotMatch(source, /pull_request_target/, `${file}: pull_request_target is not allowed`);
  for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
    assert.match(match[1], /@[a-f0-9]{40}$/i, `${file}: actions must be pinned to a full commit SHA (${match[1]})`);
  }
  assert.match(source, /^permissions:\s*\n\s+contents:\s+read/m, `${file}: top-level permissions must be least-privilege`);
  const workflow = parse(source);
  assert.ok(workflow.on, `${file}: workflow event trigger is required`);
  assert.ok(workflow.jobs && Object.keys(workflow.jobs).length > 0, `${file}: at least one job is required`);
  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    assert.ok(job['runs-on'], `${file}:${jobId} must declare its runner`);
    assert.ok(Array.isArray(job.steps) && job.steps.length > 0, `${file}:${jobId} must have steps`);
  }
  workflows.set(file, workflow);
}
const ci = workflows.get('ci.yml');
for (const required of ['quality', 'environment-policy', 'runtime-seo']) {
  assert.ok(ci?.jobs?.[required], `ci.yml must keep the stable ${required} required-check name`);
}
assert.match(ci.jobs['deploy-staging'].if, /push.*refs\/heads\/main/);
assert.equal(ci.jobs['deploy-staging'].environment, 'staging');
for (const job of ['quality', 'environment-policy', 'runtime-seo']) {
  assert.doesNotMatch(JSON.stringify(ci.jobs[job]), /secrets\./, `${job} must not access deployment secrets`);
}
const release = workflows.get('production-release.yml');
assert.equal(release?.jobs?.['deploy-production']?.environment, 'Production');
assert.ok(release?.jobs?.['deploy-production']?.needs?.includes('prepare-production'), 'production deploy must require the prebuilt manifest artifact');
assert.ok(workflows.get('database-migrations.yml')?.jobs?.migrate, 'D1 migrations use a separate explicit workflow');
console.log(`Workflow policy passed for ${files.length} workflow files: pinned actions, read-only defaults, and no pull_request_target.`);
