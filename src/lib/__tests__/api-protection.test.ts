// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { apiPolicy } from '../api-policy';
import { publicProperty } from '../public-property';
import { verifyWhatsAppSignature } from '../whatsapp-signature';
const mocks = vi.hoisted(() => ({ findMany: vi.fn(), findUnique: vi.fn(), verify: vi.fn(), upsert: vi.fn(), save: vi.fn(), signer: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: {
  property: { findMany: mocks.findMany, findUnique: mocks.findUnique },
  user: { upsert: mocks.upsert }, contractSigner: { findFirst: mocks.signer },
} }));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: vi.fn() }));
vi.mock('@clerk/backend/webhooks', () => ({ verifyWebhook: mocks.verify }));
vi.mock('@/lib/server-store', () => ({ ServerStore: { saveMessage: mocks.save } }));
import { GET as properties } from '../../pages/api/v1/[collection]/index';
import { GET as property } from '../../pages/api/v1/[collection]/[id]';
import { POST as clerkWebhook } from '../../pages/api/webhooks/clerk';
import { POST as whatsappWebhook } from '../../pages/api/webhooks/whatsapp';
import { POST as sign } from '../../pages/api/v1/generated-contracts/[id]/sign';
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CLERK_WEBHOOK_SIGNING_SECRET', 'test-signing-secret');
  vi.stubEnv('WHATSAPP_APP_SECRET', 'test-meta-secret');
  vi.stubEnv('SIGNATURE_SIMULATION_ENABLED', 'false');
});
it.each(['/api/v1/clientes', '/api/v1/contratos', '/api/v1/generated-contracts/1/sign', '/api/whatsapp', '/api/v1/emails/send', '/api/new-route'])(
  'protects private API %s by default', path => expect(Array.isArray(apiPolicy(path, 'POST'))).toBe(true));
it('keeps property browsing public but protects modifications', () => {
  expect(apiPolicy('/api/v1/imoveis/1', 'GET')).toBe('public-properties');
  expect(Array.isArray(apiPolicy('/api/v1/imoveis/1', 'PUT'))).toBe(true);
  expect(apiPolicy('/api/v1/cobrancas', 'GET')).toEqual(['Admin', 'Financeiro']);
  expect(apiPolicy('/api/v1/debug-templates', 'GET')).toEqual(['Admin']);
});
it('does not exempt arbitrary webhook paths', () => {
  expect(apiPolicy('/api/webhooks/clerk', 'POST')).toBe('webhook');
  expect(Array.isArray(apiPolicy('/api/webhooks/other', 'POST'))).toBe(true);
});
it('uses a public allowlist, including against unexpected future fields', () => {
  expect(publicProperty({ _id: '1', precoVenda: 400, nomeProprietario: 'Owner', telefoneProprietario: 'secret', ownerId: '2', numero: '10', unknownSecret: true }))
    .toEqual({ _id: '1', precoVenda: 400 });
});
it('filters anonymous lists and removes owner details', async () => {
  mocks.findMany.mockResolvedValue([{ id: '1', status: 'AVAILABLE', nomeProprietario: 'secret', title: 'Casa' }]);
  const result = await properties({ params: { collection: 'imoveis' }, locals: {}, request: new Request('https://test/api/v1/imoveis?filterField=status&filterValue=SOLD') } as any);
  expect(mocks.findMany.mock.calls[0][0].where.AND).toContainEqual({ status: 'AVAILABLE' });
  expect(await result.text()).not.toContain('secret');
});
it('hides unavailable properties from anonymous detail requests', async () => {
  mocks.findUnique.mockResolvedValue({ id: '1', status: 'SOLD' });
  const result = await property({ params: { collection: 'imoveis', id: '1' }, locals: {}, request: new Request('https://test/api/v1/imoveis/1') } as any);
  expect(result.status).toBe(404);
});
it('retains full records for verified staff', async () => {
  mocks.findUnique.mockResolvedValue({ id: '1', status: 'SOLD', nomeProprietario: 'Owner' });
  const result = await property({ params: { collection: 'imoveis', id: '1' }, locals: { propertyStaffAccess: true }, request: new Request('https://test/api/v1/imoveis/1') } as any);
  expect((await result.json()).nomeProprietario).toBe('Owner');
});
it('validates Meta HMAC against exact body bytes', () => {
  const raw = '{"object":"whatsapp_business_account"}';
  const header = 'sha256=' + createHmac('sha256', 'secret').update(raw).digest('hex');
  expect(verifyWhatsAppSignature(raw, header, 'secret')).toBe(true);
  expect(verifyWhatsAppSignature(raw + ' ', header, 'secret')).toBe(false);
  expect(verifyWhatsAppSignature(raw, null, 'secret')).toBe(false);
  expect(verifyWhatsAppSignature(raw, 'sha256=00', 'secret')).toBe(false);
});
it('rejects an invalid Clerk event before any database write', async () => {
  mocks.verify.mockRejectedValue(new Error('bad signature'));
  const response = await clerkWebhook({ request: new Request('https://test/api/webhooks/clerk', { method: 'POST', body: '{}' }) } as any);
  expect(response.status).toBe(401);
  expect(mocks.upsert).not.toHaveBeenCalled();
});
it('accepts a verified Clerk event', async () => {
  mocks.verify.mockResolvedValue({ type: 'user.created', data: { id: 'user_1', email_addresses: [{ email_address: 'test@example.com' }] } });
  const response = await clerkWebhook({ request: new Request('https://test/api/webhooks/clerk', { method: 'POST', body: '{}' }) } as any);
  expect(response.status).toBe(200);
  expect(mocks.upsert).toHaveBeenCalledOnce();
});
it('rejects unsigned WhatsApp events', async () => {
  const response = await whatsappWebhook({ request: new Request('https://test/api/webhooks/whatsapp', { method: 'POST', body: '{}' }) } as any);
  expect(response.status).toBe(401);
  expect(mocks.save).not.toHaveBeenCalled();
});
it('disables unconfigured webhooks', async () => {
  vi.stubEnv('WHATSAPP_APP_SECRET', '');
  const response = await whatsappWebhook({ request: new Request('https://test/api/webhooks/whatsapp', { method: 'POST', body: '{}' }) } as any);
  expect(response.status).toBe(503);
});
it('does not record a real signature through the prototype', async () => {
  const response = await sign({ params: { id: '1' }, request: new Request('https://test/api/v1/generated-contracts/1/sign', { method: 'POST', body: '{}' }) } as any);
  expect(response.status).toBe(501);
  expect(mocks.signer).not.toHaveBeenCalled();
});
