export const staffRoles = ['Admin', 'Corretor', 'Operacional', 'Financeiro'];
export function apiPolicy(path: string, method: string) {
  if (!path.startsWith('/api/')) return 'page';
  if (path === '/api/webhooks/clerk' || path === '/api/webhooks/whatsapp') return 'webhook';
  if (method === 'GET' && /^\/api\/v1\/imoveis(?:\/[^/]+)?$/.test(path)) return 'public-properties';
  if (path.startsWith('/api/admin/') || path.startsWith('/api/v1/usuariossistema') ||
      path.startsWith('/api/v1/debug-') || path === '/api/sync-to-postgres' ||
      path === '/api/v1/contract-templates/import-all') return ['Admin'];
  if (path.startsWith('/api/v1/cobrancas')) return ['Admin', 'Financeiro'];
  return staffRoles;
}
