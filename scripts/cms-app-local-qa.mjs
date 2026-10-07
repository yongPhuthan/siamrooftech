import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { getPlatformProxy } from 'wrangler';
import { provisionAdminUser } from './admin-users.mjs';

const baseUrl = process.env.CMS_QA_BASE_URL || 'http://localhost:3000';
const authOrigin = process.env.CMS_QA_AUTH_ORIGIN || baseUrl;
const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc', persist: true, remoteBindings: false });
const { APP_DB } = proxy.env;
const suffix = randomUUID().slice(0, 12);
const email = `cms-qa-${suffix}@example.invalid`;
const password = `Qa-${randomBytes(22).toString('base64url')}-8!`;
let userId;
let articleId;
let collisionId;
let cookie = '';

const metadata = {
  title: 'Local CMS QA article',
  slug: `local-cms-qa-${suffix}`,
  excerpt: 'Temporary local test content.',
  category: 'QA',
  authorName: 'Local QA',
  authorType: 'Organization',
  topic: 'CMS integration',
  intent: 'informational',
  tags: [],
  seoTitle: 'Local CMS QA article',
  seoDescription: 'Temporary local test content for CMS verification.',
  sources: [],
};
const heading = { type: 'heading', attrs: { level: 2, id: `section-${suffix.padEnd(8, 'x')}` }, content: [{ type: 'text', text: 'Local verification heading' }] };
const outline = { type: 'doc', content: [heading] };
const complete = { type: 'doc', content: [heading, { type: 'paragraph', content: [{ type: 'text', text: 'Published content for local CMS verification.' }] }] };

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  if (init.method && init.method !== 'GET') {
    headers.set('origin', path.startsWith('/api/auth/') ? authOrigin : baseUrl);
    headers.set('x-requested-with', 'XMLHttpRequest');
  }
  return fetch(new URL(path, baseUrl), { ...init, headers, redirect: 'manual' });
}

try {
  const { createAuth } = await import('../src/features/auth/auth.ts');
  const auth = createAuth(proxy.env);
  const context = await auth.$context;
  const user = await provisionAdminUser({
    findUserByEmail: (value, options) => context.internalAdapter.findUserByEmail(value, options),
    findUserById: (id) => context.internalAdapter.findUserById(id),
    createUser: (data, source) => context.internalAdapter.createUser(data, source),
    createAccount: (data) => context.internalAdapter.createAccount(data),
    updateUser: (id, data) => context.internalAdapter.updateUser(id, data),
    deleteUserSessions: (id) => context.internalAdapter.deleteUserSessions(id),
    findCredentialAccount: (id) => context.internalAdapter.findCredentialAccount(id),
    updatePassword: (id, hash) => context.internalAdapter.updatePassword(id, hash),
    hashPassword: (value) => context.password.hash(value),
  }, { action: 'create', email, name: 'Local CMS QA', password });
  userId = user.id;

  const denied = await request('/api/admin/articles');
  assert.equal(denied.status, 401, 'unauthenticated admin API is denied');

  const signin = await request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(signin.status, 200, 'local admin can sign in through the app route');
  const setCookies = typeof signin.headers.getSetCookie === 'function'
    ? signin.headers.getSetCookie()
    : [signin.headers.get('set-cookie') || ''];
  cookie = setCookies.map((value) => value.split(';', 1)[0]).filter(Boolean).join('; ');
  assert.ok(cookie, 'sign-in issues an HttpOnly session cookie');

  const projectsResponse = await request('/api/projects');
  assert.equal(projectsResponse.status, 200, 'authenticated project admin API responds');
  assert.equal((await projectsResponse.json()).length, 16, 'the app reads the imported D1 project records');

  const draftResponse = await request('/api/admin/articles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 0, metadata, document: outline }),
  });
  assert.equal(draftResponse.status, 201, `article draft creation succeeds: ${draftResponse.status}`);
  const draft = await draftResponse.json();
  articleId = draft.id;
  assert.equal(draft.revision, 0);
  assert.equal((await request(`/articles/${metadata.slug}`)).status, 404, 'draft detail is not public');

  const preview = await request(`/api/admin/articles/${articleId}/preview`);
  assert.equal(preview.status, 200, 'authenticated draft preview is available');
  assert.match((await preview.json()).html, /Local verification heading/);

  const saveResponse = await request(`/api/admin/articles/${articleId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 0, metadata, document: complete }),
  });
  assert.equal(saveResponse.status, 200, 'draft can be saved independently');
  const saved = await saveResponse.json();
  assert.equal(saved.revision, 1);

  const publishResponse = await request(`/api/admin/articles/${articleId}/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 1 }),
  });
  assert.equal(publishResponse.status, 200, `publish succeeds and invalidates tags: ${publishResponse.status}`);
  const published = await publishResponse.json();
  assert.equal(published.revision, 2);

  const livePage = await request(`/articles/${metadata.slug}`);
  assert.equal(livePage.status, 200, 'published content renders on the public route');
  assert.match(await livePage.text(), /Published content for local CMS verification/);
  const sitemap = await request('/sitemap.xml');
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), new RegExp(`/articles/${metadata.slug}`));

  const collisionDraftResponse = await request('/api/admin/articles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 0, metadata, document: complete }),
  });
  assert.equal(collisionDraftResponse.status, 201, 'a private draft can propose a currently used slug');
  const collisionDraft = await collisionDraftResponse.json();
  collisionId = collisionDraft.id;
  const collisionPublish = await request(`/api/admin/articles/${collisionId}/publish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 0 }),
  });
  assert.equal(collisionPublish.status, 409, 'a duplicate public slug is rejected');
  const collisionAfter = await request(`/api/admin/articles/${collisionId}`);
  assert.equal((await collisionAfter.json()).revision, 0, 'slug conflict does not partially advance the losing draft');
  assert.match(await (await request(`/articles/${metadata.slug}`)).text(), /Published content for local CMS verification/);

  const staleSave = await request(`/api/admin/articles/${articleId}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 1, metadata, document: complete }),
  });
  assert.equal(staleSave.status, 409, 'stale revisions cannot overwrite newer editorial state');

  const unpublishResponse = await request(`/api/admin/articles/${articleId}/unpublish`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ expectedRevision: 2 }),
  });
  assert.equal(unpublishResponse.status, 200, 'unpublish invalidates the article and sitemap');
  const retired = await request(`/articles/${metadata.slug}`);
  assert.equal(retired.status, 404, 'unpublished article is a real 404');
  assert.equal(retired.headers.get('location'), null, 'unpublished article does not redirect');
  assert.doesNotMatch(await (await request('/sitemap.xml')).text(), new RegExp(`/articles/${metadata.slug}`));

  console.log('Local CMS app QA passed: admin session, private drafts, preview, save/publish, sitemap freshness, duplicate slug, revision conflict, and unpublish 404.');
} finally {
  for (const cleanupId of [articleId, collisionId].filter(Boolean)) {
    await APP_DB.batch([
      APP_DB.prepare('DELETE FROM content_publications WHERE entry_id=?').bind(cleanupId),
      APP_DB.prepare('DELETE FROM content_routes WHERE entry_id=?').bind(cleanupId),
      APP_DB.prepare('DELETE FROM content_drafts WHERE entry_id=?').bind(cleanupId),
      APP_DB.prepare('DELETE FROM content_entries WHERE id=?').bind(cleanupId),
    ]);
  }
  if (userId) {
    await APP_DB.batch([
      APP_DB.prepare('DELETE FROM session WHERE user_id=?').bind(userId),
      APP_DB.prepare('DELETE FROM account WHERE user_id=?').bind(userId),
      APP_DB.prepare('DELETE FROM user WHERE id=?').bind(userId),
    ]);
  }
  await proxy.dispose();
}
