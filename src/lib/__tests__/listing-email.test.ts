// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { listingFields, listingPrice, matchesTransaction } from '../property-listing';
const mocks = vi.hoisted(() => ({ send: vi.fn(), log: vi.fn() }));
vi.mock('resend', () => ({ Resend: class { emails = { send: mocks.send }; } }));
vi.mock('@/lib/prisma', () => ({ prisma: { emailLog: { create: mocks.log } } }));
import { EmailService } from '../../services/EmailService';
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('RESEND_API_KEY', ''); });
it('maps API fields used by filters while preserving zero bedrooms', () => {
  expect(listingFields({ tipoImovel: 'Terreno', quartos: 0, areaTotal: 200, statusImovel: 'Ativo' }))
    .toMatchObject({ propertyType: 'Terreno', bedrooms: 0, area: 200, status: 'Disponível' });
});
it('matches a property offered for sale and rent with either filter', () => {
  expect(matchesTransaction('Venda e Locacao', 'Locação')).toBe(true);
  expect(matchesTransaction('Venda e Locacao', 'Venda')).toBe(true);
  expect(matchesTransaction('Venda', 'Locação')).toBe(false);
});
it('uses rental price for the rental price range', () => {
  expect(listingPrice({ precoVenda: 400000, precoLocacao: 2200 }, 'Locação')).toBe(2200);
});
it('does not simulate success without credentials', async () => {
  const result = await EmailService.sendEmail('test@example.com', 'Teste', '<p>Teste</p>');
  expect(result.status).toBe('FAILED');
  expect(result.resendId).toBeNull();
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.log.mock.calls[0][0].data.status).toBe('FAILED');
});
it('requires confirmation from the provider', async () => {
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  mocks.send.mockResolvedValue({ data: null, error: null });
  expect((await EmailService.sendEmail('test@example.com', 'Teste', 'Teste')).status).toBe('FAILED');
});
it('records a confirmed provider acceptance', async () => {
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  mocks.send.mockResolvedValue({ data: { id: 'test-message' }, error: null });
  expect(await EmailService.sendEmail('test@example.com', 'Teste', 'Teste')).toMatchObject({ status: 'SENT', resendId: 'test-message' });
});
