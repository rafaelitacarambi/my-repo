// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { contractInput, contractUpdate } from '../contract-input';
import { paginationParams } from '../pagination';
const create = vi.hoisted(() => vi.fn());
vi.mock('@/lib/prisma', () => ({ prisma: { generatedContract: { create } } }));
import { POST as generate } from '../../pages/api/v1/generated-contracts/index';
import { POST as resend } from '../../pages/api/v1/generated-contracts/[id]/resend';
import { POST as whatsapp } from '../../pages/api/whatsapp/index';
const valid = { templateId: 'template', nomeDocumento: 'Contrato', conteudoFinalHtml: '<p>Contrato</p>' };
beforeEach(() => vi.resetAllMocks());
it('rejects incomplete generated contracts', () => {
  expect(contractInput.safeParse({}).success).toBe(false);
  expect(contractInput.safeParse(valid).success).toBe(true);
});
it('cannot create a contract or signer already signed', () => {
  expect(contractInput.safeParse({ ...valid, status: 'ASSINADO' }).success).toBe(false);
  expect(contractInput.safeParse({ ...valid, signers: [{ name: 'Pessoa', email: 'p@example.com', cpf: '123', role: 'Locador', status: 'ASSINADO' }] }).success).toBe(false);
});
it.each([{ status: 'ASSINADO' }, { signedAt: new Date().toISOString() }, { signUrl: 'https://fake.test' }, { statusAssinatura: 'ASSINADO' }, { pdfUrl: 'javascript:alert(1)' }])('blocks forged signature metadata %s', input => {
  expect(contractUpdate.safeParse(input).success).toBe(false);
});
it('allows explicit cancellation', () => expect(contractUpdate.safeParse({ status: 'CANCELADO' }).success).toBe(true));
it('rejects malformed JSON before database access', async () => {
  const response = await generate({ request: new Request('https://test/api', { method: 'POST', body: '{' }) } as any);
  expect(response.status).toBe(400); expect(create).not.toHaveBeenCalled();
});
it('records generation, not a message delivery', async () => {
  create.mockResolvedValue({ id: '1', signers: [], histories: [] });
  const response = await generate({ request: new Request('https://test/api', { method: 'POST', body: JSON.stringify(valid) }) } as any);
  expect(response.status).toBe(201);
  expect(create.mock.calls[0][0].data.histories.create.event).toBe('GERACAO');
});
it('does not claim a resend or WhatsApp delivery', async () => {
  expect((await resend({} as any)).status).toBe(501);
  expect((await whatsapp({} as any)).status).toBe(501);
});
it('honors pagination bounds', () => {
  expect(paginationParams(new URLSearchParams('limit=25&skip=50'))).toEqual({ take: 25, skip: 50 });
  for (const q of ['limit=0','limit=-1','limit=5001','skip=NaN','limit=2.5']) expect(() => paginationParams(new URLSearchParams(q))).toThrow();
});
