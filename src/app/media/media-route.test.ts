import { expect, it, vi } from 'vitest';

const { getCmsRuntimeEnv } = vi.hoisted(() => ({ getCmsRuntimeEnv: vi.fn() }));
vi.mock('@/lib/database/runtime', () => ({ getCmsRuntimeEnv }));

import { GET } from './[...key]/route';

it('never serves raw originals from source/', async () => {
  const get = vi.fn();
  getCmsRuntimeEnv.mockResolvedValue({ MEDIA_BUCKET: { get } });
  const response = await GET(new Request('https://example.test/media/source/a.jpg'), { params: Promise.resolve({ key: ['source', 'a.jpg'] }) });
  expect(response.status).toBe(404);
  expect(get).not.toHaveBeenCalled();
});
