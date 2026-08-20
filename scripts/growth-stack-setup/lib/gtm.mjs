import { authedFetch } from './auth.mjs';

const BASE = 'https://www.googleapis.com/tagmanager/v2';
const SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.edit.containerversions',
  'https://www.googleapis.com/auth/tagmanager.publish',
];

const call = (path, options) => authedFetch(`${BASE}/${path}`, SCOPES, options);

export function workspacePath({ accountId, containerId, workspaceId }) {
  return `accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}`;
}

export async function listWorkspaces({ accountId, containerId }) {
  const res = await call(`accounts/${accountId}/containers/${containerId}/workspaces`);
  return res.workspace || [];
}

export async function resolveDefaultWorkspace({ accountId, containerId }) {
  const workspaces = await listWorkspaces({ accountId, containerId });
  const preferred = workspaces.find((w) => w.name === 'Default Workspace') || workspaces[0];
  if (!preferred) {
    throw new Error(
      `No workspace found for container ${containerId}. Create the container in the GTM UI first.`,
    );
  }
  return preferred.workspaceId;
}

// --- Variables (Data Layer Variable, type "v") -----------------------------

export const listVariables = (ws) => call(`${ws}/variables`).then((r) => r.variable || []);

export const createVariable = (ws, name, dataLayerKey) =>
  call(`${ws}/variables`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: 'v',
      parameter: [
        { type: 'template', key: 'name', value: dataLayerKey },
        { type: 'template', key: 'dataLayerVersion', value: '2' },
      ],
    }),
  });

export const deleteVariable = (path) => call(path, { method: 'DELETE' });

// --- Triggers (Custom Event) ------------------------------------------------

export const listTriggers = (ws) => call(`${ws}/triggers`).then((r) => r.trigger || []);

export const createTrigger = (ws, name, eventName) =>
  call(`${ws}/triggers`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      type: 'customEvent',
      customEventFilter: [
        {
          type: 'equals',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{_event}}' },
            { type: 'template', key: 'arg1', value: eventName },
          ],
        },
      ],
    }),
  });

export const deleteTrigger = (path) => call(path, { method: 'DELETE' });

// --- Tags --------------------------------------------------------------------
// GA4 tag `type` strings (e.g. "gaawe", "googtag") and their internal
// parameter schema are not part of Google's published API reference (see
// scripts/growth-stack-setup/README.md) -- these helpers stay generic and
// the setup script clones a real tag created once via the GTM UI instead of
// guessing that schema.

export const listTags = (ws) => call(`${ws}/tags`).then((r) => r.tag || []);
export const getTag = (path) => call(path);
export const createTag = (ws, body) =>
  call(`${ws}/tags`, { method: 'POST', body: JSON.stringify(body) });
export const deleteTag = (path) => call(path, { method: 'DELETE' });

// --- Versions ------------------------------------------------------------------

export const createVersion = (ws, name, notes) =>
  call(`${ws}:create_version`, {
    method: 'POST',
    body: JSON.stringify({ name, notes }),
  });

export const publishVersion = (versionPath) => call(`${versionPath}:publish`, { method: 'POST' });
