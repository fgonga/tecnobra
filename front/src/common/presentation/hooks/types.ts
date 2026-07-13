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

// import type { EntityType } from '@/modules/auth/common/presentation/components/EntitySelect.vue'
import type { AxiosResponse } from 'axios'

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}

export interface FilterOptions {
  search: string | null
  page: number
  perPage: number
  total: number
  with: string[]
  columns: string[]
  searchable: string[]
  filters: FilterCondition[]
  orderBy?: string
  sortMethod?: 'DESC' | 'ASC'
}
export type OperatorsAllowed =
  | '='
  | '!='
  | '<'
  | '>'
  | '<='
  | '>='
  | 'like'
  | 'between'
  | 'null'
  | 'in'

export interface FilterCondition {
  field: string | number | symbol
  value?: any
  operator: OperatorsAllowed
}

export type ID = string | number

export interface CrudService<T = any, U = ID> {
  index: (filters: FilterOptions) => Promise<AxiosResponse<PaginatedResponse<T>>>
  show: (id: U, filters: Pick<FilterOptions, 'columns' | 'with'>) => Promise<AxiosResponse<T>>
  store: (data: Partial<T>) => Promise<AxiosResponse<T>>
  update: (id: U, data: Partial<T>) => Promise<AxiosResponse<T>>
  destroy: (id: U) => Promise<AxiosResponse<void>>
}

export interface CrudOptions<T, ID = string | number> {
  service: CrudService<T, ID>
  defaultItem?: Partial<T>
  defaultFilters?: Partial<FilterOptions>
  idField?: keyof T
  relations?: string[]
  columns?: string[]
  searchable?: string[]
  defaultPerPage?: number
  debounceTime?: number
  autoInit?: boolean
  onError?: (error: any) => void
  onSuccess?: (
    action: 'index' | 'show' | 'store' | 'update' | 'destroy',
    result: AxiosResponse<PaginatedResponse<T>, any> | AxiosResponse<T, any> | ID,
  ) => void
  transformItem?: (item: T) => any
  beforeStore?: (item: Partial<T>) => Partial<T> | Promise<Partial<T>>
  beforeUpdate?: (id: ID, item: Partial<T>) => Partial<T> | Promise<Partial<T>>
  afterStore?: (item: T) => void | Promise<void>
  afterUpdate?: (item: T) => void | Promise<void>
  afterDestroy?: (id: ID) => void | Promise<void>
}

type IModules =
  | 'customer'
  | 'ecommerce'
  | 'auth'
  | 'billing'
  | 'ibilling'
  | 'icustomer'
  | 'irouter'
  | 'stock'

export interface IEntitySelectProps<T, U = string> {
  modelValue: any
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  showLabel?: boolean
  validationError?: string
  serverError?: string
  hint?: string
  columnClass?: string
  service: CrudService<T>
  searchFields?: string[]
  labelField?: string
  templateSubtitle?: (item: T) => string
  valueField?: string
  multiple?: boolean
  showId?: boolean
  additionalFilters?: Partial<FilterOptions>
  preloadItems?: boolean
  watch?: any
  with?: string[]
  folderName: U
  modalColumns?: Array<{ key: string; label: string; subtitle?: string }>
  entityDisplayName?: string
  module: IModules
  addModal?: boolean
  showSubtitle?: boolean
}

export type FilterFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'entity'
  | 'checkbox'
  | 'radio'

export interface FilterOption {
  value: string | number | boolean
  text: string
}

export interface FilterSchemaField<T = EntityType> {
  field: string
  label: string
  type: FilterFieldType
  operator?: OperatorsAllowed
  defaultValue?: any
  placeholder?: string
  options?: FilterOption[] // Para select, radio
  entityType?: T // Para os campos 'entity'
  columnClass?: string
  required?: boolean
  multiple?: boolean // Para select múltiplo
  disabled?: boolean
  hint?: string
  entityComponent?: any
}

export interface FilterSchema<T = unknown> {
  fields: FilterSchemaField<T>[]
  columnClass?: string
  module?: IModules
  entityComponent?: any
}
