// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), getUser: vi.fn(), createUser: vi.fn() }));
vi.mock('@clerk/backend', () => ({ createClerkClient: () => ({
  authenticateRequest: mocks.authenticate,
  users: { getUser: mocks.getUser, createUser: mocks.createUser },
}) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
import { requireAdmin } from '../require-admin';
import { accessRole } from '../access-role';
import { POST as create } from '../../pages/api/admin/users/create';
import { GET as list, POST as insert } from '../../pages/api/v1/[collection]/index';
import { GET as read, PUT as update, DELETE as remove } from '../../pages/api/v1/[collection]/[id]';
const request = (method = 'GET', headers = {}) => new Request('https://rsales.test/api/v1/usuariossistema', { method, headers });
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CLERK_SECRET_KEY', 'test-secret');
  vi.stubEnv('PUBLIC_CLERK_PUBLISHABLE_KEY', 'test-public');
  mocks.authenticate.mockResolvedValue({ isAuthenticated: true, toAuth: () => ({ userId: 'user_1' }) });
  mocks.getUser.mockResolvedValue({ publicMetadata: { role: 'Admin' } });
});
describe('administrator authorization', () => {
  it.each([undefined, '', 'USER', {}, 'SuperAdmin'])('rejects unrecognized role %s', role => {
    expect(accessRole(role)).toBeNull();
  });
  it('accepts known roles without granting Admin by default', () => {
    expect(accessRole('ADMIN')).toBe('Admin');
    expect(accessRole('Corretor')).toBe('Corretor');
  });
  it('requires configured authentication', async () => {
    vi.stubEnv('CLERK_SECRET_KEY', '');
    expect((await requireAdmin(request()))?.status).toBe(503);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });
  it('rejects unauthenticated requests', async () => {
    mocks.authenticate.mockResolvedValue({ isAuthenticated: false, toAuth: () => null });
    expect((await requireAdmin(request()))?.status).toBe(401);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });
  it.each([{}, { role: 'Corretor' }, { role: 'USER' }])('rejects non-admin metadata %s', async metadata => {
    mocks.getUser.mockResolvedValue({ publicMetadata: metadata });
    expect((await requireAdmin(request()))?.status).toBe(403);
  });
  it.each(['banned', 'locked'])('rejects %s administrators', async flag => {
    mocks.getUser.mockResolvedValue({ publicMetadata: { role: 'Admin' }, [flag]: true });
    expect((await requireAdmin(request()))?.status).toBe(403);
  });
  it('allows a verified current administrator', async () => {
    expect(await requireAdmin(request())).toBeNull();
    expect(mocks.authenticate).toHaveBeenCalledWith(expect.any(Request), {
      acceptsToken: 'session_token', authorizedParties: ['https://rsales.test'],
    });
    expect(mocks.getUser).toHaveBeenCalledWith('user_1');
  });
  it('fails closed on provider errors', async () => {
    mocks.getUser.mockRejectedValue(new Error('sensitive provider detail'));
    const result = await requireAdmin(request());
    expect(result?.status).toBe(503);
    expect(await result?.text()).not.toContain('sensitive');
  });
  it('rejects cross-origin mutations before authorization', async () => {
    expect((await requireAdmin(request('POST', { origin: 'https://other.test' })))?.status).toBe(403);
    expect(mocks.authenticate).not.toHaveBeenCalled();
  });
  it.each([[list, 'GET'], [insert, 'POST'], [read, 'GET'], [update, 'PUT'], [remove, 'DELETE'], [create, 'POST']])(
    'denies user endpoint before payload parsing or database access', async (handler, method) => {
      mocks.getUser.mockResolvedValue({ publicMetadata: { role: 'Corretor' } });
      const result = await (handler as Function)({ params: { collection: 'usuariossistema', id: '1' }, request: request(method as string) });
      expect(result.status).toBe(403);
      expect(mocks.createUser).not.toHaveBeenCalled();
    });
});
