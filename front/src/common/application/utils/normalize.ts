/*
 *  Copyright © 2021 - 2050
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

export function normalize(input): string {
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input)
      return normalize(parsed)
    } catch {
      return input
    }
  }
  if (Array.isArray(input)) return input.map(normalize)
  if (input && typeof input === 'object') {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(input)) result[k] = normalize(v)
    return result
  }
  return input
}
