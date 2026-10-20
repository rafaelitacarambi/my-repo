const roles = ['Admin', 'Corretor', 'Operacional', 'Financeiro'] as const;
export function accessRole(value: unknown): typeof roles[number] | null {
  if (typeof value !== 'string') return null;
  return roles.find(role => role.toLowerCase() === value.trim().toLowerCase()) ?? null;
}
