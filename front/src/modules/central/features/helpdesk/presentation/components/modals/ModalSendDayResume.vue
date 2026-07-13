<template>
  <ModalForm
    ref="modal"
    title="Enviar Resumo Diário"
    submit-text="Enviar"
    submit-icon="ti ti-send"
    :busy="busy"
    :errors="error"
    size="md"
    @submit="handleSubmit"
  >
    <div class="mb-3">
      <label class="form-label">Data do relatório</label>
      <input v-model="form.date" type="date" class="form-control" :max="today" />
    </div>

    <div class="mb-3">
      <label class="form-label">Destinatário</label>
      <input
        v-model="form.phone"
        type="text"
        class="form-control"
        placeholder="Ex: 244923000000"
      />
      <div class="form-text">
        Número de telefone ou deixe em branco para enviar ao grupo padrão.
        <span v-if="formattedPhone" class="text-muted ms-1">→ <code>{{ formattedPhone }}</code></span>
      </div>
    </div>

    <div v-if="preview" class="mt-3">
      <label class="form-label text-muted">Pré-visualização</label>
      <pre class="bg-light border rounded p-3 small text-reset">{{ preview }}</pre>
    </div>

    <div v-if="sent" class="alert alert-success mt-3">
      <i class="ti ti-check me-1"></i> Resumo enviado com sucesso.
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import ModalForm from '@components/ModalForm.vue'
import { HelpdeskAPIService } from '../../../domain/service/HelpdeskService'

const modal   = ref<InstanceType<typeof ModalForm> | null>(null)
const busy    = ref(false)
const error   = ref('')
const preview = ref('')
const sent    = ref(false)

const form = ref({ date: '', phone: '' })

const today = computed(() => dayjs().format('YYYY-MM-DD'))

const formattedPhone = computed(() => {
  const raw = form.value.phone.trim().replace(/\s+/g, '')
  if (!raw) return ''
  if (raw.includes('@')) return raw
  return `${raw}@s.whatsapp.net`
})

const show = () => {
  form.value    = { date: dayjs().format('YYYY-MM-DD'), phone: '' }
  preview.value = ''
  sent.value    = false
  error.value   = ''
  modal.value?.show()
}

const handleSubmit = async () => {
  busy.value    = true
  error.value   = ''
  preview.value = ''
  sent.value    = false
  try {
    const res = await HelpdeskAPIService.sendDayResume(
      form.value.date || undefined,
      formattedPhone.value || undefined,
    )
    preview.value = (res as any).preview ?? ''
    sent.value    = true
  } catch (e: any) {
    error.value =
      e?.response?.data?.message ?? e?.message ?? 'Erro ao enviar resumo.'
  } finally {
    busy.value = false
  }
}

defineExpose({ show })
</script>
