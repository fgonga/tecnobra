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
  -->
<template>
  <div
    v-if="visible && messages.length"
    :class="alertClasses"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <div class="alert-icon" v-html="icon"></div>

    <div class="alert-body">
      <h4 class="alert-heading">{{ resolvedTitle }}</h4>
      <div class="alert-description">
        <ul class="alert-list">
          <li v-for="(msg, i) in messages" :key="i">{{ msg }}</li>
        </ul>
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="btn-close"
      @click="onClose"
      aria-label="Fechar"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch } from 'vue'

type AnyErr =
  | null
  | string
  | { message?: string; type?: string; errors?: Record<string, string[] | string> }
  // formatos comuns do Axios/Laravel:
  | { response?: { data?: any } }

const props = defineProps<{
  error: AnyErr
  title?: string
  type?: string
  dismissible?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:error', value: AnyErr): void // permite v-model:error
}>()

const dismissible = computed(() => props.dismissible ?? true)
const resolvedTitle = computed(() => props.title || 'Erro')
const alertType = computed(() => props.type || getTypeFromError(props.error) || 'danger')

const alertClasses = computed(() =>
  ['alert', `alert-${alertType.value}`, dismissible.value ? 'alert-dismissible' : ''].join(' ').trim()
)

// Controla a visibilidade local, reabrindo quando chegar um novo erro
const visible = ref<boolean>(hasAnyMessage(props.error))
watch(() => props.error, (val) => { visible.value = hasAnyMessage(val) }, { immediate: true })

const messages = computed<string[]>(() => normalizeMessages(props.error))

function onClose() {
  visible.value = false
  // zera o erro no pai, se ele estiver usando v-model:error
  emit('update:error', null)
  emit('close')
}

/** Extrai o "type" se existir em algum formato comum */
function getTypeFromError(err: AnyErr): string | undefined {
  const data = unwrapAxios(err)
  return data?.type ?? (typeof err === 'object' && err && 'type' in err ? (err as any).type : undefined)
}

/** Verifica se há mensagens para mostrar */
function hasAnyMessage(err: AnyErr): boolean {
  return normalizeMessages(err).length > 0
}

/** Normaliza mensagens de vários formatos (string simples, {message}, {errors}, Axios/Laravel, etc.) */
function normalizeMessages(err: AnyErr): string[] {
  if (!err) return []

  // string direta
  if (typeof err === 'string') return [err]

  const data = unwrapAxios(err) ?? err

  // { errors: { campo: [msg1, msg2], ... } } ou { errors: { error: [...] } }
  if (typeof data === 'object' && data?.errors) {
    const list: string[] = []
    const errors = data.errors as Record<string, string[] | string>
    for (const key of Object.keys(errors)) {
      const val = errors[key]
      if (Array.isArray(val)) list.push(...val)
      else if (typeof val === 'string') list.push(val)
    }
    if (list.length) return list
  }

  // { message: '...' }
  if (typeof data === 'object' && typeof (data as any)?.message === 'string') {
    return [(data as any).message]
  }

  return []
}

/** Desembrulha Axios error (error.response.data) se houver */
function unwrapAxios(err: AnyErr): any | undefined {
  // @ts-expect-error acesso defensivo
  return err?.response?.data ?? err
}

// SVG fixo “alert-circle”
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
class="icon alert-icon icon-2"><path d="M12 22a10 10 0 1 1 0-20a10 10 0 0 1 0 20z"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>`
</script>

<style scoped>
.alert { display: flex; gap: .75rem; align-items: flex-start; }
.alert-icon { line-height: 0; margin-top: .15rem; }
.alert-body { flex: 1; }
.alert-list { margin: 0; padding-left: 1.25rem; }
.btn-close { margin-left: .25rem; }
</style>
