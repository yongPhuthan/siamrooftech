import { authedFetch } from './auth.mjs';

const BASE = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPES = ['https://www.googleapis.com/auth/analytics.edit'];

const call = (path, options) => authedFetch(`${BASE}/${path}`, SCOPES, options);

// property = "properties/123456789"

export const listCustomDimensions = (property) =>
  call(`${property}/customDimensions`).then((r) => r.customDimensions || []);

export const createCustomDimension = (property, { parameterName, displayName, scope, description }) =>
  call(`${property}/customDimensions`, {
    method: 'POST',
    body: JSON.stringify({ parameterName, displayName, scope, description }),
  });

export const archiveCustomDimension = (name) => call(`${name}:archive`, { method: 'POST', body: '{}' });

export const listKeyEvents = (property) =>
  call(`${property}/keyEvents`).then((r) => r.keyEvents || []);

export const createKeyEvent = (property, { eventName, countingMethod }) =>
  call(`${property}/keyEvents`, {
    method: 'POST',
    body: JSON.stringify({ eventName, countingMethod }),
  });

export const deleteKeyEvent = (name) => call(name, { method: 'DELETE' });
