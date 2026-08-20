#!/usr/bin/env node
// Rebuilds a GTM container's Default Workspace from
// docs/google-ads/gtm-container-build-sheet-2026-07.csv and
// docs/google-ads/gtm-ga4-conversion-mapping-2026-07.csv.
//
// See scripts/growth-stack-setup/README.md for required env vars, the
// one-time manual bootstrap steps, and why GA4 tags are cloned from a
// template instead of created from a hardcoded schema.

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
  getTag,
  createTag,
  deleteTag,
  createVersion,
} from './lib/gtm.mjs';
import { variables, triggers, tagSpecs, templateTagSpec } from './gtm-manifest.mjs';

const args = new Set(process.argv.slice(2));
const WIPE = args.has('--wipe');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

async function wipeExisting(ws) {
  console.log('--wipe: deleting existing tags, triggers, variables (in that order)...');
  for (const tag of await listTags(ws)) {
    console.log(`  delete tag:      ${tag.name}`);
    await deleteTag(tag.path);
  }
  for (const trigger of await listTriggers(ws)) {
    console.log(`  delete trigger:  ${trigger.name}`);
    await deleteTrigger(trigger.path);
  }
  for (const variable of await listVariables(ws)) {
    console.log(`  delete variable: ${variable.name}`);
    await deleteVariable(variable.path);
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
  }
  return idByName;
}

// GA4 tag `type` (e.g. "gaawe") and its parameter schema are not published
// in Google's Tag Manager API reference. Rather than guess and risk a
// silently-wrong tag on a container that fires on the live site, this finds
// a real GA4 event tag you create once by hand in the GTM UI and clones its
// exact JSON for every other event -- see README.md "Manual bootstrap".
function cloneTagForSpec(template, spec, triggerId) {
  const clone = JSON.parse(JSON.stringify(template));
  delete clone.tagId;
  delete clone.fingerprint;
  delete clone.path;
  delete clone.workspaceId;
  delete clone.accountId;
  delete clone.containerId;
  delete clone.tagManagerUrl;
  clone.name = spec.name;
  clone.firingTriggerId = [String(triggerId)];

  clone.parameter = (clone.parameter || []).map((p) => {
    if (p.key === 'eventName' || p.key === 'event') {
      return { ...p, value: spec.eventName };
    }
    return p;
  });

  const listParam = (clone.parameter || []).find((p) => p.type === 'LIST');
  if (listParam && Array.isArray(listParam.list) && listParam.list[0]) {
    const templateEntry = listParam.list[0];
    const nameKey = templateEntry.map.find((m) => /param(eter)?$/i.test(m.key))?.key;
    const valueKey = templateEntry.map.find((m) => /value$/i.test(m.key))?.key;

    if (nameKey && valueKey) {
      listParam.list = spec.parameterKeys.map((paramKey) => ({
        type: 'MAP',
        map: [
          { type: 'template', key: nameKey, value: paramKey },
          { type: 'template', key: valueKey, value: `{{DLV - ${paramKey}}}` },
        ],
      }));
    } else {
      console.warn(
        `  ! could not detect parameter/value map keys on template list for ${spec.name}; ` +
          'copying template parameters unchanged -- check this tag by hand in GTM.',
      );
    }
  }

  return clone;
}

async function ensureTags(ws, triggerIds) {
  const existingTags = await listTags(ws);
  const existingByName = new Map(existingTags.map((t) => [t.name, t]));

  const configTag = existingTags.find((t) =>
    ['googtag', 'gaawc'].includes(t.type),
  );
  if (!configTag) {
    console.log('\nManual step required before tags can be built:');
    console.log('  1. Open the GTM workspace in the browser.');
    console.log('  2. Tags > New > "Google tag" (or "GA4 Configuration").');
    console.log(`  3. Measurement ID: ${process.env.GA4_MEASUREMENT_ID || '<paste your G-XXXXXXX>'}`);
    console.log('  4. Under "Fields to Set" / "User Properties", add: lead_persona -> {{DLV - lead_persona}}');
    console.log('     (this is what makes the contractor-persona exclusion audience possible later)');
    console.log('  5. Trigger: All Pages. Name it "Google tag / GA4 base tag". Save.');
    console.log('  Then re-run: yarn gtm:setup');
    return;
  }

  const templateExisting = existingByName.get(templateTagSpec.name);
  if (!templateExisting) {
    console.log('\nManual step required before the remaining tags can be cloned:');
    console.log(`  1. Tags > New > "Google Analytics: GA4 Event".`);
    console.log(`  2. Configuration Tag: "${configTag.name}".`);
    console.log(`  3. Event Name: ${templateTagSpec.eventName}`);
    console.log(`  4. Event Parameters: add one row, e.g. parameter "position" -> {{DLV - position}}`);
    console.log(`  5. Triggering: "${templateTagSpec.triggerName}". Name it "${templateTagSpec.name}". Save.`);
    console.log('  This one tag becomes the schema template the rest are cloned from.');
    console.log('  Then re-run: yarn gtm:setup');
    return;
  }

  const template = await getTag(templateExisting.path);

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
    const body = cloneTagForSpec(template, spec, triggerId);
    console.log(`  create tag:      ${spec.name} (cloned from ${template.name})`);
    await createTag(ws, body);
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
  }

  console.log('\nVariables:');
  await ensureVariables(ws);

  console.log('\nTriggers:');
  const triggerIds = await ensureTriggers(ws);

  console.log('\nTags:');
  await ensureTags(ws, triggerIds);

  const currentTagNames = new Set((await listTags(ws)).map((t) => t.name));
  const missingTags = tagSpecs.filter((s) => !currentTagNames.has(s.name));
  if (missingTags.length > 0) {
    console.log(`\n${missingTags.length} tag(s) still pending manual bootstrap -- see messages above.`);
    return;
  }

  console.log('\nCreating a draft version (NOT publishing -- review in GTM Preview mode first)...');
  const version = await createVersion(
    ws,
    `Growth stack rebuild (${new Date().toISOString().slice(0, 10)})`,
    'Created by scripts/growth-stack-setup/gtm-setup.mjs from docs/google-ads CSVs.',
  );
  console.log(`Draft version created: ${version.containerVersion?.name || version.name}`);
  console.log('Open GTM > Versions to review, then Preview + Publish manually.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
