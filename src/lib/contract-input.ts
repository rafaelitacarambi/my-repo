import { z } from 'zod';
const reference = z.string().trim().min(1).max(200);
export const contractInput = z.object({
  leadId: reference.nullish(), propertyId: reference.nullish(), templateId: reference,
  nomeDocumento: z.string().trim().min(1).max(250),
  conteudoFinalHtml: z.string().min(1).max(2_000_000),
  status: z.literal('GERADO').optional(), method: z.string().max(80).optional(),
  signers: z.array(z.object({
    name: z.string().trim().min(1).max(200), email: z.string().email().max(254),
    phone: z.string().max(40).nullish(), cpf: z.string().trim().min(1).max(20),
    role: z.string().trim().min(1).max(80), status: z.literal('PENDENTE').optional(),
    coordsJson: z.array(z.record(z.unknown())).max(500).nullish(),
  })).max(50).optional(),
});
export const contractUpdate = z.object({
  status: z.literal('CANCELADO').optional(),
  pdfUrl: z.string().url().refine(value => new URL(value).protocol === 'https:').optional(),
}).strict().refine(value => Object.keys(value).length > 0);
