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

import {
  required as vuelidateRequired,
  email as vuelidateEmail,
  minLength as vuelidateMinLength,
  maxLength as vuelidateMaxLength,
  numeric as vuelidateNumeric,
  alpha as vuelidateAlpha,
  alphaNum as vuelidateAlphaNum,
  minValue as vuelidateMinValue,
  maxValue as vuelidateMaxValue,
  between as vuelidateBetween,
  url as vuelidateUrl,
  sameAs as vuelidateSameAs,
  integer as vuelidateInteger,
  requiredIf as vuelidateRequiredIf,
} from '@vuelidate/validators'

// Mensagens de erro personalizadas para cada validador
export const required = {
  ...vuelidateRequired,
  $message: 'Este campo é obrigatório.',
}
export const requiredIf = {
  ...vuelidateRequired,
  $message: 'Este campo é obrigatório.',
}
export const email = {
  ...vuelidateEmail,
  $message: 'Insira um e-mail válido.',
}

export const minLength = (length: number) => ({
  ...vuelidateMinLength(length),
  $message: `Este campo deve ter pelo menos ${length} caracteres.`,
})

export const maxLength = (length: number) => ({
  ...vuelidateMaxLength(length),
  $message: `Este campo deve ter no máximo ${length} caracteres.`,
})

export const numeric = {
  ...vuelidateNumeric,
  $message: 'O valor deve ser numérico.',
}

export const integer = {
  ...vuelidateInteger,
  $message: 'O valor deve ser um número inteiro.',
}

export const alpha = {
  ...vuelidateAlpha,
  $message: 'O campo deve conter apenas letras.',
}

export const alphaNum = {
  ...vuelidateAlphaNum,
  $message: 'O campo deve conter apenas letras e números.',
}

export const minValue = (value: number) => ({
  ...vuelidateMinValue(value),
  $message: `O valor deve ser maior ou igual a ${value}.`,
})

export const maxValue = (value: number) => ({
  ...vuelidateMaxValue(value),
  $message: `O valor deve ser menor ou igual a ${value}.`,
})

export const between = (min: number, max: number) => ({
  ...vuelidateBetween(min, max),
  $message: `O valor deve estar entre ${min} e ${max}.`,
})

export const url = {
  ...vuelidateUrl,
  $message: 'Insira uma URL válida.',
}

export const sameAs = (fieldName: string) => ({
  ...vuelidateSameAs(fieldName),
  $message: `O valor deve ser igual ao campo "${fieldName}".`,
})
