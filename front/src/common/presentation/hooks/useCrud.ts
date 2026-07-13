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

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { debounce } from 'lodash'
import Swal from 'sweetalert2'
import type { CrudOptions, FilterOptions, OperatorsAllowed } from './types'
import type ModalForm from '../components/ModalForm.vue'
import notification from "@common/application/utils/notification"
interface Model {
  id: number
  photo?: any
  images?: any[]
  files?: any[]
}

export const defaultFilters = {
  search: null,
  page: 1,
  perPage: 10,
  total: 0,
  with: [],
  columns: ['*'],
  searchable: [],
  filters: [],
}

type IOperations = 'index' | 'store' | 'update' | 'delete' | 'show'

export function useCrud<T extends Model, ID = string | number>(options: CrudOptions<T, ID>) {
  const {
    service,
    defaultItem = {} as Partial<T>,
    defaultFilters = {},
    idField = 'id' as keyof T,
    relations = [],
    columns = ['*'],
    searchable = [],
    defaultPerPage = 8,
    debounceTime = 900,
    autoInit = true,
    onError = (error: any) => console.error('CRUD operation error:', error),
    onSuccess = () => {},
    transformItem = (item: T) => item,
    beforeStore = (item: Partial<T>) => item,
    beforeUpdate = (id: ID, item: Partial<T>) => item,
    afterStore = () => {},
    afterUpdate = () => {},
    afterDestroy = () => {},
  } = options

  const items = ref<T[]>([])
  const selectedItem = ref<T | null>(null)
  const currentItem = ref<Partial<T>>({ ...defaultItem })
  const busy = ref<Record<IOperations, boolean>>({
    delete: false,
    index: false,
    store: false,
    update: false,
    show: false,
  })
  const errors = ref<{ message: string; errors: Record<string, string> }>({
    message: '',
    errors: {},
  })
  const totalItems = ref<number>(0)
  const currentPage = ref<number>(1)
  const itemsPerPage = ref<number>(defaultPerPage)

  const addModal = ref<InstanceType<typeof ModalForm> | null>(null)
  const editModal = ref<InstanceType<typeof ModalForm> | null>(null)
  const showSideBar = ref<boolean>(false)

  const filters = reactive<FilterOptions>({
    search: null,
    page: defaultFilters.page || 1,
    perPage: defaultFilters.perPage || defaultPerPage,
    total: 0,
    with: defaultFilters.with || relations,
    columns: defaultFilters.columns || columns,
    searchable: defaultFilters.searchable || searchable,
    filters: defaultFilters.filters || [],
  })

  const isEmpty = computed(() => items.value.length === 0)
  const isLoading = computed(() => busy.value.index)
  const hasErrors = computed(() => errors.value.message.length > 0)
  const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value))
  const currentFilters = computed(() => filters)

  const resetErrors = () => {
    errors.value = { errors: {}, message: '' }
  }

  const resetItem = () => {
    currentItem.value = { ...defaultItem }
  }

  const setCurrentItem = (item: T) => {
    currentItem.value = { ...item }
  }

  const fetchItems = async () => {
    busy.value.index = true
    resetErrors()

    try {
      const response = await service.index(filters)
      const data = response.data.data
      items.value = data.map(transformItem)
      totalItems.value = response.data.total
      filters.total = response.data.total
      onSuccess('index', response)
      return response
    } catch (error) {
      onError(error)
      throw error
    } finally {
      busy.value.index = false
    }
  }

  const fetchItem = async (id: ID) => {
    if (!service.show) {
      throw new Error('Show não foi implementado no service passado como parametro')
    }

    busy.value.show = true
    resetErrors()

    try {
      const response = await service.show(id, filters)
      const data = response.data
      selectedItem.value = transformItem(data)
      onSuccess('show', response)
      return response
    } catch (error) {
      onError(error)
      throw error
    } finally {
      busy.value.show = false
    }
  }

  async function showItem(id: ID) {
    await fetchItem(id)
    showSideBar.value = true
  }
  async function editItem(id: ID) {
    await fetchItem(id)
    editModal.value?.show()
  }

  const storeItem = async (item: Partial<T> = currentItem.value) => {
    if (!service.store) {
      throw new Error('Store não foi implementado no service passado como parametro')
    }

    busy.value.store = true
    resetErrors()

    try {
      const processedItem = await beforeStore(item)
      const response = await service.store(processedItem)
      await afterStore(response.data)

      addModal.value?.hide()
      //@ts-expect-error resetForm() eh um metodo do ModalForm
      addModal.value?.resetForm()
      onSuccess('store', response)
       notification.success('Operação concluida.');

      await fetchItems() // para voltar a buscar os itens e atualizar a lista
      return response
    } catch (error: any) {
      if (error.response?.data?.message) {
        errors.value = error.response.data
      }
      onError(error)
      throw error
    } finally {
      busy.value.store = false
    }
  }

  const updateItem = async (id: ID, item: Partial<T> = currentItem.value) => {
    if (!service.update) {
      throw new Error('Update não foi implementado no service passado como parametro')
    }

    busy.value.store = true
    resetErrors()

    try {
      const processedItem = await beforeUpdate(id, item)
      const response = await service.update(id, processedItem)
      await afterUpdate(response.data)

      editModal.value?.hide() // aqui podemos customizar depois. Eh para fechar o modal depois de atualizar o item.

      //@ts-expect-error resetForm() eh um metodo do ModalForm
      editModal.value?.resetForm()

      fetchItems()

      // TODO: ao inves de executar o fetchItems() aqui, podemos fazer uma atualizacao do item direto no array.

      // items.value = items.value.map((currentItem) => {
      //   if (currentItem.id === id) {
      //     console.log({ currentItem, id, item })
      //     return { ...currentItem, ...item }
      //   }
      //   return currentItem
      // })

      onSuccess('update', response)
       notification.success('Operação concluida.');
      return response
      // import Swal from adiciona uma prop de loading e um texto para  'sweetalert2'
    } catch (error: any) {
      if (error.response?.data?.message) {
        errors.value = error.response.data
      }
      onError(error)
      throw error
    } finally {
      busy.value.store = false
    }
  }

  const destroyItem = async (id: ID) => {
    try {
      Swal.fire({
        title: 'Tem certeza?',
        text: 'Está prestes a eliminar esse registo. Esta ação não poderá ser revertida!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar',
        preConfirm: async () => {
          Swal.showLoading()
          busy.value.delete = true
          resetErrors()

          if (!service.destroy) {
            throw new Error('Destroy não foi implementado no service passado como parametro')
          }

          try {
            await service.destroy(id)
            await afterDestroy(id)
            items.value = items.value.filter((item) => item.id !== id)
            onSuccess('destroy', id)
             notification.success('Operação concluida.');
          } catch (error) {
            console.error('Erro ao excluir:', error)
            Swal.showValidationMessage(`Erro ao excluir: ${error}`)
          } finally {
            busy.value.delete = false
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      })
      return id
    } catch (error) {
      onError(error)
      throw error
    } finally {
      busy.value.delete = false
    }
  }

  const setPage = (page: number) => {
    filters.page = page
  }

  const setPerPage = (perPage: number) => {
    filters.perPage = perPage
    filters.page = 1
  }

  const setSearch = (search: string | null) => {
    filters.search = search
    filters.page = 1
  }

  const addFilter = (column: keyof T, value: any, operator: OperatorsAllowed = '=') => {
    const existingFilterIndex = filters.filters.findIndex((f) => f.field === column)

    if (value === null || value === undefined || value === '') {
      if (existingFilterIndex !== -1) {
        filters.filters.splice(existingFilterIndex, 1)
      }
    } else {
      if (existingFilterIndex !== -1) {
        filters.filters[existingFilterIndex].value = value
        filters.filters[existingFilterIndex].operator = operator
      } else {
        filters.filters.push({ field: column, value, operator })
      }
    }

    filters.page = 1
  }

  const removeFilter = (column: keyof T) => {
    const index = filters.filters.findIndex((f) => f.field === column)
    if (index !== -1) {
      filters.filters.splice(index, 1)
      filters.page = 1
    }
  }

  const clearFilters = () => {
    filters.search = null
    filters.filters = []
    filters.page = 1
  }

  const setItems = (defaultItems: T[]) => {
    busy.value.index = false
    items.value = defaultItems.map(transformItem)
    totalItems.value = 1
    filters.total = 1
  }

  const refresh = () => fetchItems()

  // const debouncedSearch = debounce(() => {
  //   filters.page = 1
  //   fetchItems()
  // }, debounceTime)

  watch(() => filters.page, fetchItems)
  watch(
    () => filters.perPage,
    () => {
      filters.page = 1
      fetchItems()
    },
  )
  // watch(() => filters.search, debouncedSearch)

  onMounted(() => {
    if (autoInit) {
      fetchItems()
    }
  })

  return {
    service,
    items,
    selectedItem,
    currentItem,
    busy,
    errors,
    totalItems,
    filters,

    isEmpty,
    isLoading,
    hasErrors,
    totalPages,
    currentFilters,

    fetchItems,
    fetchItem,
    storeItem,
    updateItem,
    destroyItem,

    resetErrors,
    resetItem,
    setCurrentItem,

    setPage,
    setPerPage,
    setSearch,
    addFilter,
    removeFilter,
    clearFilters,

    refresh,

    editModal,
    addModal,
    showSideBar,
    setItems,
    // Funcoes para abrir Modals Crud
    // Essas funcoes recebem o ID buscam as info da entidade e abrem o modal especificado.
    showItem,
    editItem,
  }
}
