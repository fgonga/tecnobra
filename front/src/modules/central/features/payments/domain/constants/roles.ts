export const userRoles = [
  { label: 'Super Administrador', value: 'superadmin' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Utilizador normal', value: 'user' },
  { label: 'Contador', value: 'account' },
  { label: 'Suporte', value: 'helper' }
] as const;

export type UserRole = typeof userRoles[number]['value'];
