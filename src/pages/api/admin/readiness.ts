import type { APIRoute } from 'astro';
import { prisma } from '@/lib/prisma';

// The /api/admin prefix requires a verified Clerk Admin in middleware.
// This probe reads no business records and never returns environment values.
export const GET: APIRoute = async () => {
  let database: 'connected' | 'unavailable' = 'unavailable';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    // Provider errors can contain connection details; keep them out of responses.
  }
  const present = (name: string) => Boolean(process.env[name]?.trim());
  return Response.json({
    authentication: 'verified-admin',
    database,
    databaseSchema: 'not-validated',
    integrations: {
      email: present('RESEND_API_KEY') ? 'configured-not-verified' : 'not-configured',
      clerkWebhook: present('CLERK_WEBHOOK_SIGNING_SECRET') ? 'configured-not-verified' : 'not-configured',
      whatsappSending: 'not-implemented',
      whatsappStorage: 'local-file-not-production-ready',
      digitalSignature: 'not-implemented',
    },
    productionReady: false,
  }, {
    status: database === 'connected' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
};
