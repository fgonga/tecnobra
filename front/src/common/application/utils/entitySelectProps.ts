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

import type { FilterOptions } from '../hooks/types'

export const entitySelectProps = {
  modelValue: {
    type: [Number, String, Object, Array],
    default: null,
  },
  label: {
    type: String,
    default: null,
  },
  showSubtitle: {
    type: Boolean,
    default: true,
  },
  placeholder: {
    type: String,
    default: null,
  },
  required: {
    type: Boolean,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  validationError: {
    type: String,
    default: '',
  },
  serverError: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  columnClass: {
    type: String,
    default: 'col-md-12',
  },
  service: {
    type: Object,
    default: null,
  },
  searchFields: {
    type: Array,
    default: null,
  },
  labelField: {
    type: String,
    default: null,
  },
  valueField: {
    type: String,
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  showId: {
    type: Boolean,
    default: true,
  },
  additionalFilters: {
    type: Object as () => Partial<FilterOptions>,
    default: () => ({}),
  },
  preloadItems: {
    type: Boolean,
    default: false,
  },
  watch: {
    type: [Number, String, Object],
    default: 0,
  },
}
