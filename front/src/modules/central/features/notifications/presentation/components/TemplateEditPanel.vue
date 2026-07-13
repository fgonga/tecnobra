<!--
  -  Copyright © 2021 - 2026
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Painel inline de edição de um template (event_type × channel).
  -  Adaptado do projeto 2025 (sem e-mail/subject; feedback inline).
  -->

<template>
  <div class="row">
    <!-- ── TOPO: variáveis disponíveis ── -->
    <div class="col-12">
      <div class="card border-0 shadow-sm">
        <div class="card-body">
          <p class="text-muted text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2" style="font-size: 11px;">
            <Icon icon="tabler:variable" /> Variáveis disponíveis
          </p>
          <hr class="my-2" />
          <small class="text-muted d-block mb-2">Clica ou arrasta para a mensagem.</small>
          <div class="d-flex flex-wrap gap-1">
            <button
              v-for="v in variables"
              :key="v.key"
              type="button"
              draggable="true"
              class="variable-chip btn btn-sm border d-flex align-items-center gap-1"
              style="font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace; font-size: 11px; cursor: grab;"
              :title="`${v.label} — ex.: ${v.sample}`"
              @click="insertVariable(v.key)"
              @dragstart="onVariableDragStart($event, v.key)"
            >
              <span class="text-primary">&#123;&#123;</span>{{ v.key }}<span class="text-primary">&#125;&#125;</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── ESQUERDA: editor ── -->
    <div class="col-lg-7">
      <div class="card border-0 shadow-sm mt-2">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between">
            <p class="text-muted text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2" style="font-size: 11px;">
              <Icon icon="tabler:edit" /> Conteúdo
            </p>
            <div class="form-check form-switch m-0">
              <input id="tpl-enabled" class="form-check-input" type="checkbox" v-model="form.enabled" />
              <label class="form-check-label small" for="tpl-enabled">
                {{ form.enabled ? 'Activo' : 'Inactivo' }}
              </label>
            </div>
          </div>

          <hr class="my-3" />

          <div>
            <label class="form-label small fw-semibold d-flex align-items-center justify-content-between">
              <span>Mensagem</span>
              <span class="text-muted small fw-normal">
                {{ form.body.length }} chars
                <span v-if="channel === 'sms'" class="ms-1">
                  · {{ smsSegments }} {{ smsSegments === 1 ? 'segmento' : 'segmentos' }}
                </span>
              </span>
            </label>
            <textarea
              ref="bodyRef"
              v-model="form.body"
              class="form-control"
              :class="{ 'is-invalid': errors.body }"
              rows="9"
              :placeholder="bodyPlaceholder"
              style="font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace; font-size: 13px;"
              @dragover.prevent
              @drop.prevent="onDropIntoBody($event)"
            />
            <div v-if="errors.body" class="invalid-feedback">{{ errors.body }}</div>
            <small v-if="channel === 'sms' && form.body.length > 161" class="text-warning d-block mt-1">
              <Icon icon="tabler:alert-triangle" /> SMS longa será cobrada como {{ smsSegments }} mensagens.
            </small>
          </div>

          <hr class="my-3" />

          <p class="text-muted text-uppercase fw-semibold mb-2 d-flex align-items-center gap-2" style="font-size: 11px;">
            <Icon icon="tabler:send" /> Enviar teste
          </p>
          <div class="row g-2 align-items-end">
            <div class="col-md-7">
              <input
                v-model="testTo"
                type="text"
                class="form-control form-control-sm"
                placeholder="+244923000000"
              />
            </div>
            <div class="col-md-5">
              <button
                class="btn btn-sm btn-outline-primary w-100"
                :disabled="testing || !testTo"
                @click="sendTest"
              >
                <Icon v-if="testing" icon="tabler:loader-2" class="me-1 spin" />
                <Icon v-else icon="tabler:send" class="me-1" />
                Enviar agora
              </button>
            </div>
            <div v-if="testResult" class="col-12">
              <div
                class="alert py-2 mb-0 small"
                :class="testResult.ok ? 'alert-success' : 'alert-danger'"
              >
                <Icon :icon="testResult.ok ? 'tabler:check' : 'tabler:x'" class="me-1" />
                {{ testResult.ok ? `Enviado para ${testResult.sent_to}` : testResult.message }}
              </div>
            </div>
          </div>

          <hr class="my-3" />

          <div v-if="feedback" class="alert py-2 small" :class="`alert-${feedback.type}`">
            {{ feedback.text }}
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <button
              v-if="template?.id"
              class="btn btn-sm btn-outline-danger"
              :disabled="saving"
              @click="onDelete"
            >
              <Icon icon="tabler:trash" class="me-1" /> Repor default
            </button>
            <span v-else />
            <button
              class="btn btn-sm btn-primary"
              :disabled="saving || !canSave"
              @click="save"
            >
              <Icon v-if="saving" icon="tabler:loader-2" class="me-1 spin" />
              <Icon v-else icon="tabler:device-floppy" class="me-1" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── DIREITA: pré-visualização ── -->
    <div class="col-lg-5">
      <div class="card border-0 shadow-sm mt-2">
        <div class="card-body">
          <p class="text-muted text-uppercase fw-semibold mb-0 d-flex align-items-center gap-2" style="font-size: 11px;">
            <Icon icon="tabler:eye" /> Pré-visualização
          </p>
          <hr class="my-3" />
          <div v-if="previewing" class="text-center py-4">
            <div class="spinner-border spinner-border-sm text-muted" />
          </div>
          <div v-else>
            <small class="text-muted text-uppercase fw-semibold" style="font-size: 10px;">Corpo</small>
            <div
              class="preview-body mt-2 rounded p-3"
              style="white-space: pre-wrap; font-size: 13px; line-height: 1.6; min-height: 140px;"
            >{{ preview.body || '(vazio)' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type {
  INotificationChannel,
  INotificationEventType,
  INotificationTemplate,
  INotificationVariable,
  IPreviewResponse,
  ISendTestResponse,
} from '../../application/dtos/notification'
import {
  NotificationTemplateExtras,
  NotificationTemplateService,
} from '../../domain/service/NotificationTemplateService'

const props = defineProps<{
  eventType: INotificationEventType
  channel: INotificationChannel
  template: INotificationTemplate | null
  variables: INotificationVariable[]
}>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const form = reactive({
  body: '' as string,
  enabled: true,
})
const errors = reactive<{ body?: string }>({})

const saving = ref(false)
const previewing = ref(false)
const preview = ref<IPreviewResponse>({ body: '' })
const feedback = ref<{ text: string; type: string } | null>(null)

const testTo = ref('')
const testing = ref(false)
const testResult = ref<ISendTestResponse | null>(null)

const bodyRef = ref<HTMLTextAreaElement | null>(null)

// Regra de negócio: 1 mensagem (segmento) = 161 caracteres, espaços incluídos.
const smsSegments = computed(() => Math.max(1, Math.ceil(form.body.length / 161)))
const canSave = computed(() => form.body.trim() !== '')

const bodyPlaceholder = computed(() =>
  props.channel === 'sms'
    ? 'Texto curto (ideal ≤161 chars). Pode usar {{customer.first_name}}.'
    : 'Mensagem WhatsApp. Suporta *negrito*, _itálico_ e variáveis.',
)

watch(
  () => [props.eventType, props.channel, props.template] as const,
  () => resetFromTemplate(),
  { immediate: true },
)

function resetFromTemplate() {
  errors.body = undefined
  testResult.value = null
  feedback.value = null
  if (props.template) {
    form.body = props.template.body
    form.enabled = !!props.template.enabled
  } else {
    form.body = ''
    form.enabled = true
  }
  refreshPreview()
}

let previewTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => form.body,
  () => {
    if (previewTimer) clearTimeout(previewTimer)
    previewTimer = setTimeout(refreshPreview, 250)
  },
)

async function refreshPreview() {
  if (!form.body) {
    preview.value = { body: '' }
    return
  }
  previewing.value = true
  try {
    preview.value = await NotificationTemplateExtras.preview({
      event_type: props.eventType,
      channel: props.channel,
      body: form.body,
    })
  } catch {
    /* erros tratados globalmente */
  } finally {
    previewing.value = false
  }
}

function onVariableDragStart(e: DragEvent, key: string) {
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('text/plain', `{{${key}}}`)
}

function onDropIntoBody(e: DragEvent) {
  const token = e.dataTransfer?.getData('text/plain')
  if (!token) return
  const el = bodyRef.value
  if (!el) {
    form.body = (form.body || '') + token
    return
  }
  let pos = el.selectionStart ?? form.body.length
  if ((document as any).caretPositionFromPoint) {
    const cp = (document as any).caretPositionFromPoint(e.clientX, e.clientY)
    if (cp) pos = cp.offset
  } else if ((document as any).caretRangeFromPoint) {
    const range = (document as any).caretRangeFromPoint(e.clientX, e.clientY)
    if (range) pos = range.startOffset
  }
  form.body = form.body.slice(0, pos) + token + form.body.slice(pos)
  nextTick(() => {
    el.focus()
    const newPos = pos + token.length
    el.setSelectionRange(newPos, newPos)
  })
}

function insertVariable(key: string) {
  const token = `{{${key}}}`
  const el = bodyRef.value
  if (!el) {
    form.body = (form.body || '') + token
    return
  }
  const start = el.selectionStart ?? form.body.length
  const end = el.selectionEnd ?? form.body.length
  form.body = form.body.slice(0, start) + token + form.body.slice(end)
  nextTick(() => {
    el.focus()
    const pos = start + token.length
    el.setSelectionRange(pos, pos)
  })
}

async function save() {
  errors.body = undefined
  feedback.value = null
  if (!form.body.trim()) {
    errors.body = 'Mensagem obrigatória.'
    return
  }
  saving.value = true
  try {
    const payload = {
      event_type: props.eventType,
      channel: props.channel,
      language: 'pt',
      offset_days: null,
      body: form.body,
      enabled: form.enabled,
    }
    if (props.template?.id) {
      await NotificationTemplateService.update(props.template.id, payload)
      feedback.value = { text: 'Template actualizado.', type: 'success' }
    } else {
      await NotificationTemplateService.store(payload)
      feedback.value = { text: 'Template criado.', type: 'success' }
    }
    emit('saved')
  } catch (e: any) {
    feedback.value = { text: e?.response?.data?.message ?? 'Erro ao guardar.', type: 'danger' }
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!props.template?.id) return
  if (!window.confirm('Repor este template para o default? O conteúdo actual será perdido.')) return
  saving.value = true
  try {
    await NotificationTemplateService.destroy(props.template.id)
    feedback.value = { text: 'Template eliminado.', type: 'success' }
    emit('saved')
  } catch {
    feedback.value = { text: 'Erro ao eliminar.', type: 'danger' }
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  if (!testTo.value) return
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await NotificationTemplateExtras.test({
      event_type: props.eventType,
      channel: props.channel,
      to: testTo.value,
      body: form.body,
      template_id: props.template?.id ?? null,
    })
  } catch (e: any) {
    testResult.value = { ok: false, message: e?.response?.data?.message ?? 'Erro ao enviar.' }
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.spin { animation: spin 1s linear infinite; }
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.preview-body {
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
}
.variable-chip {
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
  border-color: var(--bs-border-color) !important;
}
.variable-chip:hover { background: var(--bs-secondary-bg); }
</style>
