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

import axios from 'axios'
import type {
  CrudService,
  FilterOptions,
  PaginatedResponse,
  FilterCondition,
} from '@common/hooks/types'

const MOCK_BASE_URL = import.meta.env.VITE_MOCK_API_URL || 'http://localhost:3001'

const mockAPI = axios.create({
  baseURL: MOCK_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const convertFiltersToJsonServer = (filters: FilterOptions) => {
  const params: Record<string, any> = {}

  if (filters.page && filters.perPage) {
    params._page = filters.page
    params._per_page = filters.perPage
  }

  if (filters.orderBy) {
    params._sort = filters.orderBy
    params._order = filters.sortMethod?.toLowerCase() || 'asc'
  }

  if (filters.search) {
    params.q = filters.search
  }

  if (filters.filters && filters.filters.length > 0) {
    filters.filters.forEach((filter: FilterCondition) => {
      const field = String(filter.field)

      switch (filter.operator) {
        case '=':
          params[field] = filter.value
          break
        case '!=':
          params[`${field}_ne`] = filter.value
          break
        case '<':
          params[`${field}_lt`] = filter.value
          break
        case '<=':
          params[`${field}_lte`] = filter.value
          break
        case '>':
          params[`${field}_gt`] = filter.value
          break
        case '>=':
          params[`${field}_gte`] = filter.value
          break
        case 'like':
          params[`${field}_like`] = filter.value
          break
        case 'null':
          params[`${field}_null`] = true
          break
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            params[`${field}_gte`] = filter.value[0]
            params[`${field}_lte`] = filter.value[1]
          }
          break
      }
    })
  }

  if (filters.with && filters.with.length > 0) {
    // filters.with.forEach((relation) => {
    //   params[`_embed`] = relation
    // })
  }

  return params
}

const convertJsonServerResponse = <T>(
  response: any,
  page: number = 1,
  perPage: number = 10,
): PaginatedResponse<T> => {


  const data = response.data
  const total = response.items
  const lastPage = response.last
  const from = response.first
  const to = response.next

  return {
    data: Array.isArray(data) ? data : [data],
    current_page: page || 1,
    per_page: perPage || 10,
    total,
    last_page: lastPage || 2,
    from,
    to,
  }
}

export const createMockService = <T>(resource: string): CrudService<T> => {
  return {
    index: async (filters) => {
      const params = convertFiltersToJsonServer(filters)
      const response = await mockAPI.get(`/${resource}`, { params })

      const paginatedData = convertJsonServerResponse<T>(
        response.data,
        filters.page || 1,
        filters.perPage || 10,
      )

      return {
        ...response,
        data: paginatedData,
      }
    },

    show: async (id, filters) => {
      const params: Record<string, any> = {}

      if (filters.with && filters.with.length > 0) {
        filters.with.forEach((relation) => {
          params[`_embed`] = relation
        })
      }

      return await mockAPI.get(`/${resource}/${id}`, { params })
    },

    store: async (data) => {
      // @ts-expect-error errors
      delete data.errors

      return await mockAPI.post(`/${resource}`, {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    },

    update: async (id, data) => {
      // @ts-expect-error errors
      delete data.errors
      return await mockAPI.put(`/${resource}/${id}`, data)
    },

    destroy: async (id) => {
      return await mockAPI.delete(`/${resource}/${id}`)
    },
  }
}
