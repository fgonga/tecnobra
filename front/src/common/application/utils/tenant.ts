/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export function isCentral() {
  const host = window.location.hostname
  const parts = host.split('.')
  let subdomain = parts[0]
  const hasCentralSubDomain = import.meta.env.VITE_CENTRAL_SUBDOMAIN ?? false
  if (!hasCentralSubDomain) return false
  if (hasCentralSubDomain == subdomain) {
    return true
  }
  return false
}

export function getContext(): 'global' | 'central' | 'tenant' {
  const host = window.location.hostname;
  const parts = host.split('.');
  const centralSubdomain = import.meta.env.VITE_CENTRAL_SUBDOMAIN || 'central';

  // Ex: system.local
  if (parts.length === 2) {
    return 'global';
  }

  // Ex: central.system.local
  if (parts.length >= 3 && parts[0] === centralSubdomain) {
    return 'central';
  }

  // Ex: qualquercoisa.system.local
  return 'tenant';
}

export function inCurrentTenantSubDomain() {
  const tenantSubDomain = import.meta.env.VITE_TENANT_SUBDOMAIN ?? false

  if (!tenantSubDomain) return true
  const host = window.location.hostname
  const parts = host.split('.')
  let subdomain = parts[0]
  if (tenantSubDomain == subdomain) {
    return true
  }
  return false
}
export function expliciteInCurrentTenantSubDomain() {
  const tenantSubDomain = import.meta.env.VITE_TENANT_SUBDOMAIN ?? false

  if (!tenantSubDomain) return true

  const host = window.location.hostname
  const parts = host.split('.')

  let subdomain = null
  if (parts.length > 2) {
    subdomain = parts[0]
  }
  if (tenantSubDomain == subdomain) {
    return true
  }
  return false
}
export function tenantHost() {
  const tenantUrl = import.meta.env.VITE_TENANT_URL ?? false
  const protocol = import.meta.env.VITE_PROTOCOL ?? 'http'
  let hostname = window.location.hostname
  let hostPart = []

  // Verificar se ele tem subdomain ou não.
  if (!tenantUrl) {
    throw new Error('Insira um tenant url ou um tenant domain')
  }
  const parts = tenantUrl.split('.')

  if (parts.length <= 2) {
    hostPart = hostname.split('.')
    return `${protocol}://${hostPart[0]}.${tenantUrl}`
  }
  return `${protocol}://${tenantUrl}`
}
