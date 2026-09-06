#!/usr/bin/env node
// Rebuilds a GTM container's Default Workspace from
// docs/google-ads/gtm-container-build-sheet-2026-07.csv and
// docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv.
//
// See scripts/growth-stack-setup/README.md for required env vars and how
// the "Google tag" / "GA4 Event" tag schema below was confirmed (built by
// creating real tags against a live container and reading back what the
// API actually accepted -- Google doesn't publish these `type` strings or
// their parameter shapes in the Tag Manager API reference).

import {
  workspacePath,
  resolveDefaultWorkspace,
  listVariables,
  createVariable,
  deleteVariable,
  listTriggers,
  createTrigger,
  deleteTrigger,
  listTags,
  createTag,
  deleteTag,
  createVersion,
  publishVersion,
} from './lib/gtm.mjs';
import { variables, triggers, tagSpecs, retiredArtifacts } from './gtm-manifest.mjs';

const args = new Set(process.argv.slice(2));
const WIPE = args.has('--wipe');
const PUBLISH = args.has('--publish');

// GTM's implicit, always-present "All Pages" trigger. Not returned by
// triggers.list (it's not a real trigger resource) -- this numeric ID is a
// fixed constant Google Tag Manager uses across every container.
const ALL_PAGES_TRIGGER_ID = '2147479553';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

// Tag Manager API has a modest default per-minute query quota, easy to trip
// during a bulk wipe/rebuild (30+ variables plus triggers plus tags). A
// small delay between writes keeps a full run under it.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function wipeExisting(ws) {
  console.log('--wipe: deleting existing tags, triggers, variables (in that order)...');
  for (const tag of await listTags(ws)) {
    console.log(`  delete tag:      ${tag.name}`);
    await deleteTag(tag.path);
    await sleep(1000);
  }
  for (const trigger of await listTriggers(ws)) {
    console.log(`  delete trigger:  ${trigger.name}`);
    await deleteTrigger(trigger.path);
    await sleep(1000);
  }
  for (const variable of await listVariables(ws)) {
    console.log(`  delete variable: ${variable.name}`);
    await deleteVariable(variable.path);
    await sleep(1000);
  }
}

async function retireLegacyArtifacts(ws) {
  const retiredTagNames = new Set(retiredArtifacts.tags);
  const retiredTriggerNames = new Set(retiredArtifacts.triggers);
  const retiredVariableNames = new Set(retiredArtifacts.variables);

  // Delete dependants first so GTM never rejects an in-use trigger/variable.
  for (const tag of await listTags(ws)) {
    if (!retiredTagNames.has(tag.name)) continue;
    console.log(`  retire tag:      ${tag.name}`);
    await deleteTag(tag.path);
    await sleep(1000);
  }
  for (const trigger of await listTriggers(ws)) {
    if (!retiredTriggerNames.has(trigger.name)) continue;
    console.log(`  retire trigger:  ${trigger.name}`);
    await deleteTrigger(trigger.path);
    await sleep(1000);
  }
  for (const variable of await listVariables(ws)) {
    if (!retiredVariableNames.has(variable.name)) continue;
    console.log(`  retire variable: ${variable.name}`);
    await deleteVariable(variable.path);
    await sleep(1000);
  }
}

async function ensureVariables(ws) {
  const existing = new Map((await listVariables(ws)).map((v) => [v.name, v]));
  const idByName = new Map();
  for (const v of variables) {
    if (existing.has(v.name)) {
      idByName.set(v.name, existing.get(v.name).variableId);
      continue;
    }
    console.log(`  create variable: ${v.name} (data layer key: ${v.dataLayerKey})`);
    const created = await createVariable(ws, v.name, v.dataLayerKey);
    idByName.set(v.name, created.variableId);
    await sleep(1000);
  }
  return idByName;
}

async function ensureTriggers(ws) {
  const existing = new Map((await listTriggers(ws)).map((t) => [t.name, t]));
  const idByName = new Map();
  for (const t of triggers) {
    if (existing.has(t.name)) {
      idByName.set(t.name, existing.get(t.name).triggerId);
      continue;
    }
    console.log(`  create trigger:  ${t.name} (event: ${t.eventName})`);
    const created = await createTrigger(ws, t.name, t.eventName);
    idByName.set(t.name, created.triggerId);
    await sleep(1000);
  }
  return idByName;
}

function buildGa4EventTag(spec, measurementId, triggerId) {
  return {
    name: spec.name,
    type: 'gaawe',
    parameter: [
      { type: 'template', key: 'eventName', value: spec.eventName },
      { type: 'template', key: 'measurementIdOverride', value: measurementId },
      {
        type: 'list',
        key: 'eventSettingsTable',
        list: spec.parameterKeys.map((paramKey) => ({
          type: 'map',
          map: [
            { type: 'template', key: 'parameter', value: paramKey },
            { type: 'template', key: 'parameterValue', value: `{{DLV - ${paramKey}}}` },
          ],
        })),
      },
    ],
    firingTriggerId: [String(triggerId)],
  };
}

async function ensureTags(ws, triggerIds) {
  const measurementId = requireEnv('GA4_MEASUREMENT_ID');
  const existingByName = new Map((await listTags(ws)).map((t) => [t.name, t]));
  const CONFIG_TAG_NAME = 'Google tag / GA4 base tag';

  if (!existingByName.has(CONFIG_TAG_NAME)) {
    console.log(`  create tag:      ${CONFIG_TAG_NAME} (Measurement ID: ${measurementId})`);
    await createTag(ws, {
      name: CONFIG_TAG_NAME,
      type: 'googtag',
      parameter: [{ type: 'template', key: 'tagId', value: measurementId }],
      firingTriggerId: [ALL_PAGES_TRIGGER_ID],
    });
    await sleep(1000);
  }

  for (const spec of tagSpecs) {
    if (existingByName.has(spec.name)) {
      console.log(`  tag already exists, skipping: ${spec.name}`);
      continue;
    }
    const triggerId = triggerIds.get(spec.triggerName);
    if (!triggerId) {
      console.warn(`  ! no trigger id for ${spec.triggerName}, skipping ${spec.name}`);
      continue;
    }
    console.log(`  create tag:      ${spec.name} (event: ${spec.eventName})`);
    await createTag(ws, buildGa4EventTag(spec, measurementId, triggerId));
    await sleep(1000);
  }
}

async function main() {
  const accountId = requireEnv('GTM_ACCOUNT_ID');
  const containerId = requireEnv('GTM_CONTAINER_ID');

  const workspaceId = await resolveDefaultWorkspace({ accountId, containerId });
  const ws = workspacePath({ accountId, containerId, workspaceId });
  console.log(`Workspace: ${ws}`);

  if (WIPE) {
    await wipeExisting(ws);
  } else {
    console.log('\nRetiring legacy survey artifacts:');
    await retireLegacyArtifacts(ws);
  }

  console.log('\nVariables:');
  await ensureVariables(ws);

  console.log('\nTriggers:');
  const triggerIds = await ensureTriggers(ws);

  console.log('\nTags:');
  await ensureTags(ws, triggerIds);

  console.log(`\nCreating a ${PUBLISH ? 'publishable' : 'draft'} version...`);
  const version = await createVersion(
    ws,
    `Growth stack rebuild (${new Date().toISOString().slice(0, 10)})`,
    'Created by scripts/growth-stack-setup/gtm-setup.mjs from docs/google-ads CSVs.',
  );
  const containerVersion = version.containerVersion;
  console.log(`Version created: ${containerVersion?.name || version.name}`);
  if (PUBLISH) {
    if (!containerVersion?.path) {
      throw new Error('GTM create_version response did not include a publishable version path');
    }
    await publishVersion(containerVersion.path);
    console.log('Version published.');
  } else {
    console.log('Open GTM > Versions to review, then Preview + Publish manually.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
