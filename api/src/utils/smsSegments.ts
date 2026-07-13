/**
 * Regra de negócio: 1 mensagem (segmento) = 161 caracteres, espaços incluídos.
 * 162 chars → 2 mensagens, e assim por diante. Mínimo de 1 segmento.
 */
export const SMS_SEGMENT_SIZE = 161;

export function smsSegments(body: string): number {
  const len = (body ?? "").length;
  return Math.max(1, Math.ceil(len / SMS_SEGMENT_SIZE));
}
