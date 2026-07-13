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

const pages = import.meta.glob('@/modules/**/*.vue')
const commonpages = import.meta.glob('@common/views/**/*.vue')
export const page = (path: string) => {
  return pages[`/src/modules/${path}.vue`] || commonpages['src/common/views/errors/not_found.vue']
}
export const kernel = (path: string) => {
  return  commonpages[`src/common/views/${path}.vue`]
}
