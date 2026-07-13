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
export const defaultRateLimit = (max: number, timeWindow: string) => ({
  max,
  timeWindow,

  keyGenerator: (req: any) => {
    // Se estiver autenticado usa o ID
    if (req.user?.sub) return `user:${req.user.sub}`;
    return req.ip;
  },

  skip: (req: any) => {
    // Se for superadmin não aplica rate limit
    if (req.user?.role === "superadmin") {
      return true;
    }
    return false;
  },

  errorResponseBuilder: () => ({
    message: "Muitas requisições, aguarde 1 minuto.",
    status: 429,
  }),
});

