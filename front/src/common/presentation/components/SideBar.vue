<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<template>
  <div class="sidebar-wrapper">
    <BOffcanvas style="min-width: 500px;" :id="id" :title="title" :visible="isOpen"
      placement="end" @hidden="handleHidden" @shown="handleShown" backdrop :body-class="bodyClass"
      :header-class="'sidebar-header fw-bold py-3 fs-2'" :class="['sidebar-container', { 'multi-tab': isMultiTab }]"
      :width="width">
      <template v-if="isMultiTab && tabs.length > 0">
        <BTabs v-model="activeTab" card>
          <BTab v-for="(tab, index) in tabs" :key="index" :title="tab.title" :title-item-class="tab.titleClass"
            :active="activeTab === index">
            <component :is="tab.component" :style="hasPadding ? 'padding: 10px 14px' : 'padding-top:10px'"
              @close="$emit('close', $event)"
              v-bind="Object.assign(tab.props || {}, { active: activeTab === index && isOpen })"
              @edit="$emit('edit', $event)" @delete="$emit('delete', $event)" @refresh="$emit('refresh')" />
          </BTab>
        </BTabs>
      </template>
      <template v-else>
        <div class="pt-0">
          <component @close="$emit('close', $event)" v-model="tabs[0].vModel"
            :style="hasPadding ? 'padding: 10px 14px' : 'padding-top:10px'" :is="tabs[0].component"
            v-bind="tabs[0].props || {}" @edit="$emit('edit', $event)" @delete="$emit('delete', $event)"
            @refresh="$emit('refresh')" />
        </div>
      </template>

      <template v-if="$slots.footer" #footer>
        <slot name="footer"></slot>
      </template>
    </BOffcanvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSidebarStore } from '../stores/sidebar'

interface Tab {
  title: string
  component: any
  titleClass?: string
  props?: Record<string, any>
  vModel?: any
}

const props = defineProps({
  id: {
    type: String,
    default: 'sidebar',
  },
  title: {
    type: String,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '50%',
  },
  tabs: {
    type: Array as () => Tab[],
    default: () => [],
  },
  defaultTab: {
    type: Number,
    default: 0,
  },
  hasPadding: {
    type: Boolean,
    default: true,
  },
  bodyClass: {
    type: String,
    default: 'px-0',
    required: false
  },
  headerClass: {
    type: String,
    default: '',
    required: false
  },
})

const emit = defineEmits(['close', 'tabChange', 'edit', 'delete', 'refresh'])

const activeTab = ref(props.defaultTab)
const isMultiTab = computed(() => props.tabs && props.tabs.length > 1)
const sidebarStore = useSidebarStore()

const currentLevel = computed(() => {
  return sidebarStore.getSidebarLevel(props.id)
})

const isOpenRef = ref(props.isOpen)

watch(
  () => props.isOpen,
  (newValue) => {
    isOpenRef.value = newValue
  },
  { immediate: true },
)

watch(isOpenRef, (newValue) => {
  if (newValue) {
    sidebarStore.registerSidebar(props.id)
  } else {
    sidebarStore.unregisterSidebar(props.id)
  }
})

// Handle sidebar shown event
const handleShown = () => {
  // Fix any backdrop issues after sidebar is fully shown
  setTimeout(() => {
    fixBackdrops()
  }, 50)
}

// Handle sidebar hidden event
const handleHidden = () => {
  sidebarStore.unregisterSidebar(props.id)
  emit('close')

  setTimeout(() => {
    fixBackdrops()
  }, 50)
}

const fixBackdrops = () => {
  const backdrops = document.querySelectorAll('.offcanvas-backdrop')
  const sidebars = document.querySelectorAll('.offcanvas.show')

  if (backdrops.length > sidebars.length) {
    backdrops.forEach((backdrop, index) => {
      if (index >= sidebars.length) {
        backdrop.remove()
      }
    })
  }

  sidebars.forEach((sidebar, index) => {
    const level = index + 1
    const zIndex = 1040 + level * 10

      ; (sidebar as HTMLElement).style.zIndex = zIndex.toString()

    if (backdrops[index]) {
      ; (backdrops[index] as HTMLElement).style.zIndex = (zIndex - 5).toString()
    }
  })
}

watch(activeTab, (newTab) => {
  emit('tabChange', newTab)
})

onBeforeUnmount(() => {
  sidebarStore.unregisterSidebar(props.id)
})

function close() {
  emit('close')
}

function setActiveTab(index: number) {
  if (index >= 0 && index < (props.tabs?.length || 0)) {
    activeTab.value = index
  }
}

defineExpose({
  close,
  setActiveTab,
})
</script>

<style>
.offcanvas .offcanvas-title {
  font-size: 1.1rem;
  font-weight: bold;
  line-height: 1.5rem;
}

.nav-tabs {
  border-bottom: 1px solid var(--tblr-border-color);
}

.nav-tabs .nav-item .nav-link {
  border: none;
  color: var(--tblr-secondary-color);
  padding: 0.75rem 1rem;
  margin-right: 0.5rem;
  text-decoration: none;
  border-radius: 0;
  transition: all 0.2s ease-in-out;
}

.nav-tabs .nav-item .nav-link:hover {
  color: var(--tblr-body-color);
  background-color: var(--tblr-bg-surface-secondary);
  border-bottom: none;
}

.nav-tabs .nav-item .nav-link.active {
  color: var(--tblr-body-color);
  background-color: transparent;
  border-bottom: 2px solid var(--tblr-primary);
  font-weight: 500;
}
</style>

<style scoped>

.sidebar-wrapper {
  position: relative;
}

.sidebar-container {
  transition: transform 0.3s ease-in-out !important;
  animation: slideIn 0.3s ease-in-out;
  border: none !important;
  background-color: var(--tblr-bg-surface-secondary) !important;
}

.sidebar-header {
  border-bottom: 1px solid var(--tblr-border-color);
}

.sidebar-body {
  height: calc(100vh - 60px);
  overflow-y: auto;
}

/* Estilos para o modo multi-tab */
.multi-tab .tab-content {
  padding: 0;
}

.multi-tab .tab-pane {
  padding: 0;
}

/* Animation for opening sidebar */
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }

  to {
    transform: translateX(0);
  }
}

@media (max-width: 576px) {
  .sidebar-container {
    width: 100% !important;
  }
}
</style>
