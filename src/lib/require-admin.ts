import { createClerkClient } from '@clerk/backend';
import { accessRole } from './access-role';

const deny = (status: number, error: string) => Response.json({ error }, {
  status, headers: { 'Cache-Control': 'no-store' },
});

/** Authorize before reading a payload or touching the database. */
export async function requireAdmin(request: Request): Promise<Response | null> {
  const secretKey = import.meta.env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;
  const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return deny(503, 'Autenticação não configurada.');
  const origin = new URL(request.url).origin;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const suppliedOrigin = request.headers.get('origin');
    if ((suppliedOrigin && suppliedOrigin !== origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return deny(403, 'Origem não permitida.');
    }
  }
  try {
    const clerk = createClerkClient({ secretKey, publishableKey });
    const state = await clerk.authenticateRequest(request, {
      acceptsToken: 'session_token', authorizedParties: [origin],
    });
    const auth = state.toAuth();
    if (!state.isAuthenticated || !auth?.userId) return deny(401, 'Faça login para continuar.');
    // Read current server-managed metadata; never trust roles from the request body.
    const user = await clerk.users.getUser(auth.userId);
    if (user.banned || user.locked || accessRole(user.publicMetadata?.role) !== 'Admin') {
      return deny(403, 'Acesso restrito a administradores.');
    }
    return null;
  } catch {
    return deny(503, 'Não foi possível validar o acesso. Tente novamente.');
  }
}
