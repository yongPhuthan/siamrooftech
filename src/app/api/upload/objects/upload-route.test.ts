import { afterEach, expect, it, vi } from 'vitest';

const { getCmsRuntimeEnv, verifyAdminRequest, put } = vi.hoisted(() => ({
  getCmsRuntimeEnv: vi.fn(),
  verifyAdminRequest: vi.fn(),
  put: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/api-auth', () => ({
  verifyAdminRequest,
  unauthorizedResponse: () => Response.json({ error: 'Unauthorized' }, { status: 401 }),
}));
vi.mock('@/lib/database/runtime', () => ({ getCmsRuntimeEnv }));

import { PUT } from './[...key]/route';

afterEach(() => {
  vi.restoreAllMocks();
  getCmsRuntimeEnv.mockReset();
  verifyAdminRequest.mockReset();
  put.mockReset();
});

function uploadRequest(body: Uint8Array, contentLength = body.byteLength) {
  const bodyBuffer = new ArrayBuffer(body.byteLength);
  new Uint8Array(bodyBuffer).set(body);
  return new Request('https://example.test/api/upload/objects/thumbnail/cover.jpg', {
    method: 'PUT',
    headers: {
      origin: 'https://example.test',
      host: 'example.test',
      'content-type': 'image/jpeg',
      'content-length': String(contentLength),
    },
    body: bodyBuffer,
  });
}

it('writes a fixed-size byte payload to R2 and returns its media URL', async () => {
  verifyAdminRequest.mockResolvedValue({ role: 'admin' });
  put.mockResolvedValue({});
  getCmsRuntimeEnv.mockResolvedValue({ APP_DB: {}, MEDIA_BUCKET: { put } });

  const response = await PUT(uploadRequest(new Uint8Array([1, 2, 3])), {
    params: Promise.resolve({ key: ['thumbnail', 'cover.jpg'] }),
  });

  expect(response.status).toBe(200);
  expect(put).toHaveBeenCalledOnce();
  expect(put).toHaveBeenCalledWith('thumbnail/cover.jpg', new Uint8Array([1, 2, 3]), expect.objectContaining({
    httpMetadata: { contentType: 'image/jpeg' },
  }));
  await expect(response.json()).resolves.toMatchObject({ publicUrl: '/media/thumbnail/cover.jpg' });
});

it('rejects a body whose actual byte count differs from Content-Length', async () => {
  verifyAdminRequest.mockResolvedValue({ role: 'admin' });

  const response = await PUT(uploadRequest(new Uint8Array([1, 2, 3]), 4), {
    params: Promise.resolve({ key: ['thumbnail', 'cover.jpg'] }),
  });

  expect(response.status).toBe(400);
  expect(put).not.toHaveBeenCalled();
});

it('returns a safe reference ID when the R2 write fails', async () => {
  verifyAdminRequest.mockResolvedValue({ role: 'admin' });
  put.mockRejectedValue(new Error('R2 internal detail'));
  getCmsRuntimeEnv.mockResolvedValue({ APP_DB: {}, MEDIA_BUCKET: { put } });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);

  const response = await PUT(uploadRequest(new Uint8Array([1, 2, 3])), {
    params: Promise.resolve({ key: ['thumbnail', 'cover.jpg'] }),
  });
  const payload = await response.json() as { referenceId: string; error: string };

  expect(response.status).toBe(503);
  expect(payload).toMatchObject({ error: 'Image upload failed' });
  expect(payload.referenceId).toMatch(/^[0-9a-f-]{36}$/i);
});
