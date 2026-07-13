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

import _ from 'lodash'

export function formatterDate(date: string) {
  return new Date(date).toLocaleString('pt-AO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
export function formatterDateNoHour(date: string) {
  return new Date(date).toLocaleString('pt-AO', {
    dateStyle: 'medium',
  })
}

export const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined) return '0,00 KZ'
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  const isDecimal = numValue % 1 !== 0
  const formattedValue = isDecimal
    ? numValue.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(numValue).toLocaleString('pt-AO')
  // const formattedValue = Math.round(numValue).toLocaleString('pt-AO')
  return `${formattedValue} KZ`
}

export const formatQuantity = (value: number | string | undefined): string => {
  if (value === undefined) return '0 unidades'
  return value === 1 ? '1 unidade' : `${value} unidades`
}

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export const formatDiscountValue = (
  value: number | undefined,
  type: string | undefined,
): string => {
  if (value === undefined) return ''

  if (type === 'percentage') {
    return `${value}%`
  } else if (type === 'fixed_amount') {
    return `${formatCurrency(value)}`
  } else if (type === 'free_shipping') {
    return 'Frete Grátis'
  }

  return `${value}`
}

export const getPriceAdjustmentColor = (adjustment: number) => {
  let color = adjustment > 0 ? 'text-success' : 'text-danger'

  if (adjustment == 0) {
    color = ''
  }

  return color
}

export const formatPriceAdjustment = (adjustment: number, format: Function) => {
  let prefix = adjustment > 0 ? '+' : '-'
  if (adjustment == 0) {
    prefix = ''
  }
  return `${prefix} ${format(Math.abs(adjustment))}`
}

export const formatGender = (gender: string | undefined): string => {
  if (!gender) return 'Não especificado'

  const genders: Record<string, string> = {
    male: 'Masculino',
    female: 'Feminino',
    other: 'Outro',
    prefer_not_to_say: 'Prefere não informar',
  }

  return genders[gender] || gender
}

export const formatCustomerType = (customerType: string | undefined): string => {
  if (!customerType) return 'Não especificado'

  const customerTypes: Record<string, string> = {
    individual: 'Pessoa Fisica',
    company: 'Empresa',
  }

  return customerTypes[customerType] || customerType
}

export function objectToSearchParams(obj: Record<string, any>): string {
  const params = new URLSearchParams()

  function appendParam(key: string, value: any, parentKey?: string) {
    const finalKey = parentKey ? `${parentKey}[${key}]` : key

    if (value === null || value === undefined) {
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([k, v]) => {
            appendParam(k, v, `${finalKey}[${index}]`)
          })
        } else {
          params.append(`${finalKey}[]`, item.toString())
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([k, v]) => {
        appendParam(k, v, finalKey)
      })
    } else {
      params.append(finalKey, value.toString())
    }
  }

  Object.entries(obj).forEach(([key, value]) => {
    appendParam(key, value)
  })

  return params.toString()
}

export const formatCustomerStatus = (status: 'active' | 'inactive'): string => {
  const statusMap = {
    active: 'Ativo',
    inactive: 'Inativo',
  }
  return statusMap[status] || status
}

/**
 * Transforma objetos com propriedade 'id' em propriedades '_id'
 * Exemplo: { category: { id: 2, name: 'Test' } } => { category_id: 2 }
 */
export function transformObjectsToIds<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Verifica se o valor é um objeto (não null, não array) e tem propriedade 'id'
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'id' in value &&
      value.id !== null &&
      value.id !== undefined
    ) {
      // Transforma o objeto em uma propriedade _id
      if (value.id) result[`${key}_id`] = value.id
    } else if (
      // Se for array de objetos com id, transforma em array de ids
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (item) =>
          item !== null &&
          typeof item === 'object' &&
          'id' in item &&
          item.id !== null &&
          item.id !== undefined,
      )
    ) {
      result[`${key}_ids`] = value.map((item) => item.id)
    } else {
      // Mantém o valor original se não for um objeto com id
      result[key] = value
    }
  }

  return result
}

// Versão mais específica apenas para objetos únicos (não arrays)
export function transformSingleObjectsToIds<T extends Record<string, any>>(
  obj: T,
): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    // Verifica se é objeto único com id
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'id' in value &&
      value.id !== null &&
      value.id !== undefined
    ) {
      result[`${key}_id`] = value.id
    } else {
      result[key] = value
    }
  }

  return result
}

// Exemplo de uso:
/*
const input = {
  name: 'Produto Test',
  price: 100.50,
  category: { id: 2, name: 'Electronics' },
  brand: { id: 5, name: 'Samsung' },
  tags: [
    { id: 1, name: 'Popular' },
    { id: 3, name: 'Featured' }
  ],
  description: 'Descrição do produto',
  user: null,
  active: true
};

const output = transformObjectsToIds(input);
// Resultado:
// {
//   name: 'Produto Test',
//   price: 100.50,
//   category_id: 2,
//   brand_id: 5,
//   tags_ids: [1, 3],
//   description: 'Descrição do produto',
//   user: null,
//   active: true
// }

const outputSingle = transformSingleObjectsToIds(input);
// Resultado (sem transformar arrays):
// {
//   name: 'Produto Test',
//   price: 100.50,
//   category_id: 2,
//   brand_id: 5,
//   tags: [{ id: 1, name: 'Popular' }, { id: 3, name: 'Featured' }],
//   description: 'Descrição do produto',
//   user: null,
//   active: true
// }
*/
