import { defineMiddleware } from 'astro:middleware';
import { apiPolicy, staffRoles } from './lib/api-policy';
import { requireRoles } from './lib/require-admin';

export const onRequest = defineMiddleware(async (context, next) => {
  let path: string;
  try { path = decodeURIComponent(context.url.pathname).replace(/\/+$/, '') || '/'; }
  catch { return new Response('Invalid path', { status: 400 }); }
  const policy = apiPolicy(path, context.request.method);
  if (policy === 'page' || policy === 'webhook') return next();
  if (policy === 'public-properties') {
    const denied = await requireRoles(context.request, staffRoles);
    (context.locals as any).propertyStaffAccess = denied === null;
  } else {
    const denied = await requireRoles(context.request, policy);
    if (denied) return denied;
  }
  const response = await next();
  response.headers.set('Cache-Control', 'no-store');
  return response;
});
