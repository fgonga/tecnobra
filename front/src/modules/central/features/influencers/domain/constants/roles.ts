export const influencerRoles = [
  { label: 'Super Administrador', value: 'superadmin' },
  { label: 'Administrador', value: 'admin' },
  { label: 'Utilizador normal', value: 'influencer' },
  { label: 'Contador', value: 'account' },
  { label: 'Suporte', value: 'helper' }
] as const;

export type InfluencerRole = typeof influencerRoles[number]['value'];
