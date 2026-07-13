<!--
  -  Copyright © 2021 - 2026
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Layout split: esquerda lista de eventos (filtrável), direita editor inline
  -  com tabs por canal (SMS / WhatsApp). Adaptado do projeto 2025.
  -->

<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="d-flex flex-column overflow-hidden tpl-page">
        <div class="d-flex flex-grow-1 overflow-hidden gap-3" style="min-height: 0;">

      <!-- ─── ESQUERDA: lista de eventos ─── -->
      <div class="event-sidebar d-flex flex-column rounded border overflow-hidden" style="width: 288px; min-width: 288px;">
        <div class="p-3 border-bottom">
          <div class="input-group input-group-sm">
            <span class="input-group-text border-end-0 pe-1">
              <Icon icon="tabler:search" class="text-muted" style="font-size: 14px;" />
            </span>
            <input
              v-model="search"
              type="text"
              class="form-control border-start-0 ps-1"
              placeholder="Procurar evento..."
            />
          </div>
        </div>

        <div class="event-list flex-grow-1 overflow-y-auto">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border spinner-border-sm text-primary" />
          </div>
          <template v-else>
            <button
              v-for="event in filteredEvents"
              :key="event"
              type="button"
              class="event-item w-100 text-start border-0 border-bottom p-3 d-flex align-items-start gap-2"
              :class="{ active: selectedEvent === event }"
              @click="selectEvent(event)"
            >
              <div
                class="event-icon flex-shrink-0 rounded d-flex align-items-center justify-content-center mt-1"
                style="width: 32px; height: 32px; background: rgba(13,110,253,0.09);"
              >
                <Icon :icon="EVENT_ICONS[event]" class="text-primary" style="font-size: 16px;" />
              </div>
              <div class="flex-grow-1 min-width-0">
                <div class="fw-semibold lh-sm text-truncate" style="font-size: 13px;">{{ EVENT_LABELS[event] }}</div>
                <div class="text-muted text-truncate" style="font-size: 11px;">{{ EVENT_DESCRIPTIONS[event] }}</div>
                <div class="d-flex gap-1 mt-1">
                  <span
                    v-for="ch in CHANNELS"
                    :key="ch"
                    class="channel-pill"
                    :class="channelPillClass(event, ch)"
                    :title="CHANNEL_LABELS[ch]"
                  >
                    <Icon :icon="CHANNEL_ICONS[ch]" style="font-size: 10px;" />
                  </span>
                </div>
              </div>
              <Icon icon="tabler:chevron-right" class="text-muted flex-shrink-0 mt-1" style="font-size: 13px;" />
            </button>
          </template>
        </div>
      </div>

      <!-- ─── DIREITA: editor ─── -->
      <div class="flex-grow-1 d-flex flex-column overflow-hidden border rounded">
        <div v-if="!selectedEvent" class="empty-state flex-grow-1 d-flex align-items-center justify-content-center text-center">
          <div class="text-muted">
            <Icon icon="tabler:template" style="font-size: 56px; opacity: 0.18;" />
            <p class="mt-3 mb-0 fw-semibold">Selecciona um evento</p>
            <small>Escolhe um evento na lista para editar os templates</small>
          </div>
        </div>

        <template v-else>
          <div class="editor-header border-bottom">
            <div class="px-4 py-3 d-flex align-items-center gap-3">
              <div
                class="rounded d-flex align-items-center justify-content-center flex-shrink-0"
                style="width:40px; height:40px; background:rgba(13,110,253,0.09);"
              >
                <Icon :icon="EVENT_ICONS[selectedEvent]" class="text-primary" style="font-size: 20px;" />
              </div>
              <div>
                <h5 class="mb-0 fw-bold">{{ EVENT_LABELS[selectedEvent] }}</h5>
                <small class="text-muted">{{ EVENT_DESCRIPTIONS[selectedEvent] }}</small>
              </div>
            </div>

            <hr class="m-0" />

            <div class="px-3">
              <ul class="nav nav-tabs border-0">
                <li v-for="ch in CHANNELS" :key="ch" class="nav-item">
                  <button
                    type="button"
                    class="nav-link d-flex align-items-center gap-2 px-3"
                    :class="{ active: currentChannel === ch }"
                    @click="currentChannel = ch"
                  >
                    <Icon :icon="CHANNEL_ICONS[ch]" />
                    <span>{{ CHANNEL_LABELS[ch] }}</span>
                    <span class="badge ms-1" :class="channelTabBadgeClass(selectedEvent, ch)">
                      {{ channelTabBadgeText(selectedEvent, ch) }}
                    </span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div class="editor-body flex-grow-1 overflow-y-auto p-3">
            <TemplateEditPanel
              :key="`${selectedEvent}-${currentChannel}`"
              :event-type="selectedEvent"
              :channel="currentChannel"
              :template="currentTemplateForPanel"
              :variables="variablesForCurrent"
              @saved="onSaved"
            />
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import TemplateEditPanel from '../components/TemplateEditPanel.vue'
import {
  CHANNELS,
  CHANNEL_ICONS,
  CHANNEL_LABELS,
  EVENT_DESCRIPTIONS,
  EVENT_ICONS,
  EVENT_LABELS,
  type INotificationCatalog,
  type INotificationChannel,
  type INotificationEventType,
  type INotificationTemplate,
  type INotificationVariable,
} from '../../application/dtos/notification'
import {
  NotificationTemplateExtras,
  NotificationTemplateService,
} from '../../domain/service/NotificationTemplateService'

const loading = ref(false)
const catalog = ref<INotificationCatalog>({ events: [], variables: {} as never })
const templates = ref<INotificationTemplate[]>([])

const search = ref('')
const selectedEvent = ref<INotificationEventType | null>(null)
const currentChannel = ref<INotificationChannel>('sms')

const templateMap = computed(() => {
  const map: Record<string, Record<INotificationChannel, INotificationTemplate[]>> = {}
  for (const t of templates.value) {
    if (!map[t.event_type]) map[t.event_type] = { sms: [], whatsapp: [], email: [] }
    map[t.event_type][t.channel]?.push(t)
  }
  return map
})

const filteredEvents = computed(() => {
  const q = search.value.trim().toLowerCase()
  return catalog.value.events.filter((event) => {
    if (!q) return true
    return (
      EVENT_LABELS[event].toLowerCase().includes(q) ||
      EVENT_DESCRIPTIONS[event].toLowerCase().includes(q)
    )
  })
})

const variablesForCurrent = computed<INotificationVariable[]>(() => {
  if (!selectedEvent.value) return []
  return catalog.value.variables[selectedEvent.value] ?? []
})

const currentTemplateForPanel = computed(() => {
  if (!selectedEvent.value) return null
  return templateMap.value[selectedEvent.value]?.[currentChannel.value]?.[0] ?? null
})

function hasTemplate(event: INotificationEventType, channel: INotificationChannel): boolean {
  return (templateMap.value[event]?.[channel]?.length ?? 0) > 0
}
function hasEnabledTemplate(event: INotificationEventType, channel: INotificationChannel): boolean {
  return (templateMap.value[event]?.[channel] ?? []).some((t) => t.enabled)
}
function channelPillClass(event: INotificationEventType, ch: INotificationChannel) {
  if (hasEnabledTemplate(event, ch)) return 'pill--active'
  if (hasTemplate(event, ch)) return 'pill--inactive'
  return 'pill--empty'
}
function channelTabBadgeClass(event: INotificationEventType, ch: INotificationChannel) {
  if (hasEnabledTemplate(event, ch)) return 'bg-success'
  if (hasTemplate(event, ch)) return 'bg-secondary'
  return 'bg-warning text-dark'
}
function channelTabBadgeText(event: INotificationEventType, ch: INotificationChannel) {
  if (hasEnabledTemplate(event, ch)) return 'Activo'
  if (hasTemplate(event, ch)) return 'Inactivo'
  return 'Configurar'
}

function selectEvent(event: INotificationEventType) {
  selectedEvent.value = event
  currentChannel.value = 'sms'
}

async function loadAll() {
  loading.value = true
  try {
    const [cat, list] = await Promise.all([
      NotificationTemplateExtras.catalog(),
      NotificationTemplateService.index({ perPage: 500 }),
    ])
    catalog.value = cat
    const body = (list as any)?.data
    templates.value = Array.isArray(body) ? body : (body?.data ?? [])
  } finally {
    loading.value = false
  }
}

async function onSaved() {
  await loadAll()
}

onMounted(loadAll)
</script>

<style scoped>
.tpl-page {
  height: 72vh;
  min-height: 520px;
}
.min-width-0 { min-width: 0; }

.event-sidebar { background: var(--bs-body-bg); }
.event-list { background: var(--bs-tertiary-bg); }
.empty-state { background: var(--bs-body-bg); }
.editor-header { background: var(--bs-body-bg); }
.editor-body { background: var(--bs-tertiary-bg); }

.event-item {
  background: transparent;
  color: var(--bs-body-color);
  transition: background 0.12s;
  cursor: pointer;
}
.event-item:hover { background: var(--bs-body-bg); }
.event-item.active {
  background: var(--bs-body-bg);
  border-left: 3px solid var(--bs-primary) !important;
  padding-left: calc(0.75rem - 3px) !important;
}
.event-item.active .event-icon {
  background: rgba(var(--bs-primary-rgb), 0.18) !important;
}

.channel-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  font-size: 10px;
}
.channel-pill.pill--active {
  background: rgba(var(--bs-success-rgb), 0.18);
  color: var(--bs-success-text-emphasis, #198754);
}
.channel-pill.pill--inactive {
  background: rgba(var(--bs-secondary-rgb), 0.18);
  color: var(--bs-secondary-color, #6c757d);
}
.channel-pill.pill--empty {
  background: rgba(var(--bs-warning-rgb), 0.2);
  color: var(--bs-warning-text-emphasis, #856404);
}
</style>
