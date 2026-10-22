import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyWhatsAppSignature(body: string, header: string | null, secret: string): boolean {
  if (!secret || !header || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  return timingSafeEqual(expected, Buffer.from(header.slice(7), 'hex'));
}
