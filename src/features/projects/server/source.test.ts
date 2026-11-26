import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { fetchSourceProjects, projectsReadOnly, projectsSourceUrl, publicProject } = await import('./source');

const project = { id: 'p1', title: 'กันสาดพับเก็บได้ คาเฟ่', category: 'คาเฟ่', slug: 'retractable-awning-cafe-1', images: [], proof: { problem: 'บันทึกภายใน' } };

describe('project source', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is read-only only where a production source is set', () => {
    vi.stubEnv('PROJECTS_SOURCE_URL', '');
    expect(projectsReadOnly()).toBe(false);
    vi.stubEnv('PROJECTS_SOURCE_URL', 'https://www.siamrooftech.com/');
    expect(projectsSourceUrl()).toBe('https://www.siamrooftech.com');
    expect(projectsReadOnly()).toBe(true);
  });

  it('never exposes internal site notes', () => {
    expect(publicProject(project as never)).not.toHaveProperty('proof');
  });

  it('reads the feed and drops entries that no longer match the schema', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify([project, { id: 'broken' }])));
    const projects = await fetchSourceProjects('https://www.siamrooftech.com', fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith('https://www.siamrooftech.com/api/projects/published', expect.anything());
    expect(projects.map((item) => item.id)).toEqual(['p1']);
  });

  it('fails loudly when the source is down', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 503 }));
    await expect(fetchSourceProjects('https://www.siamrooftech.com', fetcher as unknown as typeof fetch)).rejects.toThrow('503');
  });
});
