import { authedFetch } from './auth.mjs';

const BASE = 'https://analyticsadmin.googleapis.com/v1beta';
const SCOPES = ['https://www.googleapis.com/auth/analytics.edit'];

const call = (path, options) => authedFetch(`${BASE}/${path}`, SCOPES, options);

// account = "accounts/123456789", property = "properties/123456789"

export const listProperties = (account) =>
  call(`properties?filter=parent:${encodeURIComponent(account)}`).then((r) => r.properties || []);

export const createProperty = (account, { displayName, timeZone, currencyCode }) =>
  call('properties', {
    method: 'POST',
    body: JSON.stringify({ parent: account, displayName, timeZone, currencyCode }),
  });

export const listDataStreams = (property) =>
  call(`${property}/dataStreams`).then((r) => r.dataStreams || []);

export const createWebDataStream = (property, { displayName, uri }) =>
  call(`${property}/dataStreams`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'WEB_DATA_STREAM',
      displayName,
      webStreamData: { defaultUri: uri },
    }),
  });

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
