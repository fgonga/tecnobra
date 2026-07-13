<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue'
import type { PropType } from 'vue'
import ActionButtons from '@components/ActionButtons.vue'
import { useCrud } from '@common/hooks/useCrud'
import type { TableFieldRaw } from 'bootstrap-vue-next'
import { BButton, BFormInput, BInputGroup } from 'bootstrap-vue-next'
import { formatterDate, objectToSearchParams } from '@common/application/utils/table'
import FieldImages from '@components/FieldImages.vue'
import type { FilterCondition, FilterSchema } from '@common/hooks/types'
import SideBar from '@components/SideBar.vue'
import TableFilter from '@components/TableFilter.vue'
import { Icon } from '@iconify/vue'
export interface ITableOption {
  id: string
  icon: string
  title: string
  component: any
  click: any
  props: any
}
export default defineComponent({
  components: {
    ActionButtons,
    FieldImages,
    SideBar,
    TableFilter,
    Icon,
  },
  props: {
    type: {
      type: Number,
      required: false,
      default: 1,
    },
    showHeader: {
      type: Boolean,
      required: false,
      default: false,
    },
    title: {
      type: String,
      required: false,
      default: '',
    },
    subtitle: {
      type: String,
      required: false,
      default: '',
    },
    modalAddComponent: {
      type: Object,
      required: false,
    },
    modalEditComponent: {
      type: Object,
      required: false,
    },
    sideBarShowComponent: {
      type: Object,
      required: false,
    },
    tableHeaders: {
      type: Array as PropType<TableFieldRaw<unknown>[]>,
      required: true,
    },
    options: {
      type: Array as PropType<ITableOption>[],
      required: false,
    },
    crudService: {
      type: Object,
      required: true,
    },
    withTimestamps: {
      type: Boolean,
      required: false,
      default: true,
    },
    selectable: {
      type: Boolean,
      required: false,
      default: false,
    },
    onShowItem: {
      type: Function,
      required: false,
    },
    withActions: {
      type: Boolean,
      required: false,
      default: true,
    },
    showDelete: {
      type: Boolean,
      required: false,
      default: true,
    },
    showEdit: {
      type: Boolean,
      required: false,
      default: true,
    },
    propsToModals: {
      type: Object,
      default: () => ({}),
    },
    propsToSideBar: {
      type: Object,
      default: () => ({}),
    },
    viewOnly: {
      type: Boolean,
      default: false,
    },
    filterSchema: {
      type: Object as () => FilterSchema,
      required: false,
      default: () => ({}),
    },
    filterSchemaWidth: {
      type: String,
      required: false,
      default: '45%',
    },
    filterSchemaDefaultFilters: {
      type: Array as () => FilterCondition[],
      default: () => [],
    },
    export: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const instance = props.crudService as ReturnType<typeof useCrud>
    const showFilterSidebar = ref(false)

    const addCreatedAtFilters = (schema: FilterSchema): FilterSchema => {
      const hasCreatedAt = schema?.fields?.some((filter) => filter.field?.includes('created_at'))
      if (!hasCreatedAt && schema.fields) {
        return {
          ...schema,
          fields: schema.fields.concat(
            {
              field: 'start|created_at',
              label: 'Data de criação (início)',
              type: 'date',
              operator: '>=',
              placeholder: 'A partir de...',
              columnClass: 'col-md-12',
            },
            {
              field: 'end|created_at',
              label: 'Data de criação (fim)',
              type: 'date',
              operator: '<=',
              placeholder: 'Até...',
              columnClass: 'col-md-12',
            },
          ),
        }
      }

      return schema
    }

    const TabFilter = computed(() => {
      return [
        {
          title: 'Filtros',
          component: TableFilter,
          props: {
            crudService: props.crudService,
            schema: addCreatedAtFilters(props.filterSchema),
            defaultFilters: props.filterSchemaDefaultFilters,
            module: props.filterSchema.module || 'ecommerce',
          },
        },
      ]
    })

    const thead = computed(() => {
      // Aqui eh para adicionar os campos de foto e imagem caso a entidade tenha algum desses campos.
      const addFirst = [
        'images' in (instance.items.value[0] || {})
          ? {
              key: 'images',
              label: 'Imagens',
              sortable: true,
            }
          : null,
        'photo' in (instance.items.value[0] || {})
          ? {
              key: 'photo',
              label: 'Foto',
              sortable: true,
            }
          : null,
      ]

      const addLast = [
        props.withTimestamps
          ? {
              key: 'created_at',
              label: 'Data Criação',
              sortable: true,
              formatter: formatterDate as any,
            }
          : null,
        props.withActions ? { key: 'action', label: 'Opções', sortable: true } : null,
      ]

      // aqui eh para eliminar todos os campos que comecam com +
      let actualTableHeaders = props.tableHeaders.filter((t) => {
        return !t.key.includes('+')
      })

      actualTableHeaders = actualTableHeaders.map((t) => {
        let realKey = t.key.replace('-', '')

        if (realKey.includes('|')) {
          const [, key2] = realKey.split('|')
          realKey = key2
        }

        return {
          ...t,
          key: realKey,
        }
      })

      let items = (actualTableHeaders as any[]).concat(addLast.filter(Boolean))
      items = [...addFirst.filter(Boolean), ...items]

      return items
    })

    function print() {
      const filters = objectToSearchParams(instance.filters)
      const fullURL = `${props.export}?${filters}`
      if (props.export) {
        window.open(fullURL, '_blank')
      } else {
        window.print()
      }
    }

    const optionsRefs = ref({})
    function handleClickOption(option: ITableOption) {
      if (option.component) {
        const modalInstance = optionsRefs.value[option.id]
        if (modalInstance) {
          modalInstance.show?.() // Chama o método exposto
        } else {
          console.warn('Ref não encontrado para:', option.id)
        }
        return
      }

      option.click?.()
    }

    function refresh() {
      return instance.fetchItems()
    }
    return {
      optionsRefs,
      ...instance,
      thead,
      showFilterSidebar,
      TabFilter,
      print,
      handleClickOption,
      refresh,
    }
  },
})
</script>
<template>
  <div v-if="type === 1">
    <div :class="{ 'mb-2': showHeader }">
      <template v-if="showHeader">
        <div class="page-header d-print-none" aria-label="Page header">
          <div class="row g-2 align-items-center">
            <div class="col">
              <!-- Page pre-title -->
              <div class="page-pretitle">{{ title }}</div>
              <h2 class="page-title">{{ subtitle }}</h2>
            </div>
            <div class="col-auto ms-auto d-print-none">
              <div class="btn-list">
                <div class="d-print-none">
                  <component
                    v-if="modalAddComponent"
                    :is="modalAddComponent"
                    ref="addModal"
                    :handler="(item: any) => storeItem(item)"
                    @saved="$emit('modal-add-saved', $event)"
                    v-bind="propsToModals"
                    :errorMessage="errors.message"
                  />

                  <component
                    v-if="sideBarShowComponent"
                    :is="sideBarShowComponent"
                    :crudService="crudService"
                    ref="sideBarShowComponent"
                    :is-open="showSideBar"
                    :id="currentItem.id"
                    :initial-tab="0"
                    @close="() => (showSideBar = false)"
                    @edit="
                      () => {
                        // showSideBar = true;
                        // editModal.show();
                      }
                    "
                    @delete="
                      () => {
                        // showSideBar = true;
                        // deleteModal.show();
                      }
                    "
                    @refresh="fetchItem(currentItem.id)"
                    v-bind="propsToSideBar"
                  />

                  <component
                    :is="modalEditComponent"
                    ref="editModal"
                    :editMode="true"
                    :defaults="currentItem"
                    :handler="(item: any) => updateItem(item.id, item)"
                    v-bind="propsToModals"
                    :errorMessage="errors.message"
                  />

                  <template v-if="!viewOnly">
                    <div class="d-flex">
                      <b-button
                        v-if="modalAddComponent"
                        @click="() => addModal?.show()"
                        variant="primary"
                        size="md"
                      >
                        <i class="ti ti-plus"></i> Adicionar
                      </b-button>

                      <BButton
                        :disabled="busy.index"
                        class="mx-2"
                        variant="default"
                        @click="fetchItems"
                        size="md"
                      >
                        <i class="ti ti-refresh me-2"></i>
                        Atualizar
                      </BButton>
                      <BDropdown text="" variant="btn-2" noCaret>
                        <template #button-content> <i class="ti ti-list"></i> Opções </template>
                        <BDropdownItem v-for="option in options" @click="handleClickOption(option)">
                          <component
                            v-if="option.component"
                            :is="option.component"
                            :ref="(el) => (optionsRefs[option.id] = el)"
                            v-bind="option.props"
                          />
                          <i :class="option.icon"></i>{{ option.title }}
                        </BDropdownItem>
                        <slot name="options" />
                      </BDropdown>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div class="page-body" :class="{ 'pt-0 mt-0': !showHeader }">
        <!-- Modo compacto: botões vivem FORA do card, mas dentro da page-body -->
        <template v-if="!showHeader">
          <component
            @saved="$emit('modal-add-saved', $event)"
            v-if="modalAddComponent"
            :is="modalAddComponent"
            ref="addModal"
            :handler="(item: any) => storeItem(item)"
            v-bind="propsToModals"
            :errorMessage="errors.message"
          />
          <component
            v-if="sideBarShowComponent"
            :is="sideBarShowComponent"
            :crudService="crudService"
            ref="sideBarShowComponent"
            :is-open="showSideBar"
            :id="currentItem.id"
            :initial-tab="0"
            @close="() => (showSideBar = false)"
            @refresh="fetchItem(currentItem.id)"
            v-bind="propsToSideBar"
          />
          <component
            :is="modalEditComponent"
            ref="editModal"
            :editMode="true"
            :defaults="currentItem"
            :handler="(item: any) => updateItem(item.id, item)"
            v-bind="propsToModals"
            :errorMessage="errors.message"
          />

          <div v-if="!viewOnly" class="d-flex justify-content-end gap-2 mb-2 d-print-none">
            <BButton
              size="md"
              v-if="modalAddComponent"
              @click="() => addModal?.show()"
              variant="primary"
            >
              <i class="ti ti-plus me-1"></i> Adicionar
            </BButton>
            <BButton size="md" :disabled="busy.index" variant="default" @click="fetchItems">
              <i class="ti ti-refresh me-1"></i> Atualizar
            </BButton>
            <BDropdown
              v-if="options.length || $slots.options"
              text=""
              variant="default"
              size="md"
              noCaret
            >
              <template #button-content>
                <i class="ti ti-list"></i>
              </template>
              <BDropdownItem
                v-for="option in options"
                :key="option.id"
                @click="handleClickOption(option)"
              >
                <component
                  v-if="option.component"
                  :is="option.component"
                  :ref="(el) => (optionsRefs[option.id] = el)"
                  v-bind="option.props"
                />
                <i :class="option.icon"></i>{{ option.title }}
              </BDropdownItem>
              <slot name="options" />
            </BDropdown>
          </div>
        </template>

        <div :class="{ 'col-md-12': !showHeader }">
          <div class="card">
            <div id="form-clientes" class="card-body">
              <!-- Linha 2: pesquisa full-width (modo compacto e modo header) -->
              <BInputGroup v-if="!viewOnly" class="mb-2 d-print-none">
                <BFormInput
                  :style="
                    Object.keys(filterSchema).length > 0
                      ? 'border-top-right-radius: 0px; border-bottom-right-radius: 0px;'
                      : ''
                  "
                  v-model="filters.search"
                  placeholder="Pesquisar"
                />
                <BButton
                  :size="showHeader ? undefined : 'sm'"
                  v-if="Object.keys(filterSchema).length > 0"
                  variant="default"
                  @click="showFilterSidebar = true"
                >
                  <Icon icon="tabler:filter" />
                  &nbsp; Filtros
                </BButton>
                <BButton :size="showHeader ? undefined : 'sm'" variant="default" @click="refresh">
                  <Icon icon="tabler:search" /> &nbsp; Pesquisar
                </BButton>
              </BInputGroup>

              <!-- SIDEBAR dos Filtros -->

              <SideBar
                @close="showFilterSidebar = false"
                :width="filterSchemaWidth"
                title="Filtro Avançado"
                :is-open="showFilterSidebar"
                :tabs="TabFilter"
              />

              <!-- <TableFilter v-if="Object.keys(filterSchema).length > 0" :filter-schema="filterSchema" /> -->

              <b-table
                size="md"
                responsive="sm"
                :striped="true"
                thead-class="bg-primary"
                :fields="thead"
                :selectable="selectable"
                :items="items"
                :busy="busy.index"
                outlined
                show-empty
              >
                <template #table-busy>
                  <div class="text-center text-primary my-2">
                    <BSpinner small class="align-middle mx-2" />
                    <span> Carregando...</span>
                  </div>
                </template>

                <template #empty>
                  <div class="text-center my-2">
                    <span class="text-muted">Nenhum registo encontrado</span>
                  </div>
                </template>

                <template #cell(photo)="row">
                  <FieldImages :cover="row.item.photo" />
                </template>
                <template #cell(images)="row">
                  <FieldImages :images="row.item.images" />
                </template>

                <template v-for="(_, name) in $slots" #[name]="slotData">
                  <slot :name="name" v-bind="slotData"></slot>
                </template>

                <template v-if="withActions" #cell(action)="row">
                  <ActionButtons
                    class="d-print-none"
                    :show-view="sideBarShowComponent != null"
                    :show-edit="modalEditComponent != null"
                    :id="row.item.id"
                    @view="
                      () => {
                        if (onShowItem) return onShowItem(row.item)
                        setCurrentItem(row.item)
                        showSideBar = true
                      }
                    "
                    @edit="
                      () => {
                        setCurrentItem(row.item)
                        editModal?.show()
                      }
                    "
                    @delete="
                      () => {
                        destroyItem(row.item.id)
                      }
                    "
                    :showDelete="showDelete"
                    :showEdit="showEdit"
                  >
                    <slot name="row-actions" :row="row.item" />
                  </ActionButtons>
                </template>
              </b-table>
              <div v-if="!viewOnly" class="d-flex justify-content-between d-print-none">
                <div class="col-md-3">
                  <b-form-select v-model="filters.perPage" class="form-control">
                    <option v-for="n in [8, 20, 30, 40, 50, 100, 9999999]" :key="n" :value="n">
                      Mostrar {{ n }}
                    </option>
                  </b-form-select>
                </div>
                <b-pagination
                  v-model="filters.page"
                  :total-rows="filters.total"
                  :per-page="filters.perPage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="type === 2">
    <div class="page-body mt-0">
      <component
        v-if="modalAddComponent"
        :is="modalAddComponent"
        ref="addModal"
        :handler="(item: any) => storeItem(item)"
        v-bind="propsToModals"
        :errorMessage="errors.message"
      />
      <component
        :is="modalEditComponent"
        ref="editModal"
        :editMode="true"
        :defaults="currentItem"
        :handler="(item: any) => updateItem(item.id, item)"
        v-bind="propsToModals"
        :errorMessage="errors.message"
      />
      <component
        v-if="sideBarShowComponent"
        :is="sideBarShowComponent"
        :crudService="crudService"
        ref="sideBarShowComponent"
        :is-open="showSideBar"
        :id="currentItem.id"
        :initial-tab="0"
        @close="() => (showSideBar = false)"
        @edit="
          () => {
            // showSideBar = true;
            // editModal.show();
          }
        "
        @delete="
          () => {
            // showSideBar = true;
            // deleteModal.show();
          }
        "
        @refresh="fetchItem(currentItem.id)"
        v-bind="propsToSideBar"
      />

      <div class="card">
        <div id="form-clientes" class="card-body">
          <BInputGroup class="mb-3 d-print-none">
            <BFormInput
              :style="
                Object.keys(filterSchema).length > 0
                  ? 'border-top-right-radius: 0px; border-bottom-right-radius: 0px;'
                  : ''
              "
              v-model="filters.search"
              placeholder="Pesquisar"
            />
            <BButton
              v-if="Object.keys(filterSchema).length > 0"
              variant="default"
              @click="showFilterSidebar = true"
            >
              <i class="ti ti-filter"></i> &nbsp; Filtrar
            </BButton>
          </BInputGroup>
          <SideBar
            @close="showFilterSidebar = false"
            :width="filterSchemaWidth"
            title="Filtro Avançado"
            :is-open="showFilterSidebar"
            :tabs="TabFilter"
          />
          <b-table
            size="md"
            responsive="sm"
            :striped="true"
            thead-class="bg-primary"
            :fields="thead"
            selectable
            :items="items"
            :busy="busy.index"
            outlined
            show-empty
          >
            <template #table-busy>
              <div class="text-center text-primary my-2">
                <BSpinner small class="align-middle mx-2" />
                <span> Carregando...</span>
              </div>
            </template>

            <template #empty>
              <div class="text-center my-2">
                <span class="text-muted">Nenhum registo encontrado</span>
              </div>
            </template>

            <template #cell(photo)="row">
              <FieldImages :cover="row.item.photo" />
            </template>
            <template #cell(images)="row">
              <FieldImages :images="row.item.images" />
            </template>

            <template v-for="(_, name) in $slots" #[name]="slotData">
              <slot :name="name" v-bind="slotData"></slot>
            </template>

            <template v-if="withActions" #cell(action)="row">
              <ActionButtons
                class="d-print-none"
                :show-view="sideBarShowComponent != null"
                :show-edit="modalEditComponent != null"
                :id="row.item.id"
                @view="
                  () => {
                    if (onShowItem) return onShowItem(row.item)
                    setCurrentItem(row.item)
                    showSideBar = true
                  }
                "
                @edit="
                  () => {
                    setCurrentItem(row.item)
                    editModal?.show()
                  }
                "
                @delete="
                  () => {
                    destroyItem(row.item.id)
                  }
                "
                :showDelete="showDelete"
              >
                <slot name="row-actions" :row="row.item" />
              </ActionButtons>
            </template>
          </b-table>
          <div class="d-flex justify-content-between d-print-none">
            <div class="col-md-3">
              <b-form-select v-model="filters.perPage" class="form-control">
                <option v-for="n in [8, 20, 30, 40, 50, 100, 9999999]" :key="n" :value="n">
                  Mostrar {{ n }}
                </option>
              </b-form-select>
            </div>
            <b-pagination
              v-model="filters.page"
              :total-rows="filters.total"
              :per-page="filters.perPage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
