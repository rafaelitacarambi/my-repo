// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { apiPolicy } from '../api-policy';
const query = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: query } }));
import { GET } from '../../pages/api/admin/readiness';
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs(); });
it('restricts deployment diagnostics to administrators', () => {
  expect(apiPolicy('/api/admin/readiness', 'GET')).toEqual(['Admin']);
});
it('checks connection without claiming integrations or schema are verified', async () => {
  query.mockResolvedValue([{ '?column?': 1 }]);
  vi.stubEnv('RESEND_API_KEY', 'private-secret');
  const response = await GET({} as any);
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('no-store');
  const text = await response.text();
  expect(text).not.toContain('private-secret');
  expect(JSON.parse(text)).toMatchObject({ database: 'connected', databaseSchema: 'not-validated', productionReady: false });
  expect(query).toHaveBeenCalledOnce();
});
it('reports database failure without leaking provider details', async () => {
  query.mockRejectedValue(new Error('postgres://sensitive-connection'));
  const response = await GET({} as any);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('sensitive-connection');
});
