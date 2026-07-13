<script setup lang="ts">
import {
  useCheckoutStore,
  usePaymentStore,
} from '@/modules/checkout/common/presentation/store/checkout'
import { storeToRefs } from 'pinia'
const checkoutStore = useCheckoutStore()
const paymentStore = usePaymentStore()
const { checkout, calculations } = storeToRefs(checkoutStore)
import Mustache from 'mustache'
import { ref, onMounted, nextTick } from 'vue'
const emit = defineEmits(['done'])
import { toData } from '@/common/application/utils/date'
import { IconPrinter, IconUserPlus } from '@tabler/icons-vue'
import checkoutService from '@/modules/checkout/common/domain/services/checkout.ts'
const props = defineProps<{ checkout: any }>()
const htmlModelo = ref('')
const busyPrint = ref(false)

onMounted(async () => {
  location.assign(
    `https://www.academiatreesix.com/pages/purchasecomplete?value=${calculations.value.totalPay}&currency=AOA&order_id=${checkout.value.orderCode}`,
  )
  // await nextTick()
  // const resp = await fetch('/recibo.html')
  // htmlModelo.value = await resp.text()
  // //

  // const el = document.querySelector('#checkout-step-3')
  // if (el) {
  //   el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  // }
})

const done = () => {
  emit('done', true)
}
const handlePrint = async (data) => {
  if (busyPrint.value) return
  busyPrint.value = true
  checkoutService
    .print({
      orderCode: checkout.value.orderCode,
      paymentCode: checkout.value.paymentCode,
    })
    .then((response) => {
      print(response.data)
    })
    .catch((error) => {
      busyPrint.value = false
    })
}
const print = async (data) => {
  try {
    // Renderizar com Mustache
    const htmlRenderizado = Mustache.render(htmlModelo.value, data)

    // Isolar no iframe
    const iframe = document.getElementById('iframeRecibo') as HTMLIFrameElement
    const doc = iframe.contentWindow?.document
    if (!doc) return
    doc.open()
    doc.write(htmlRenderizado)
    doc.close()
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  } finally {
    busyPrint.value = false
  }
}
</script>
<template>
  <div class="d-flex justify-content-center align-items-center" id="checkout-step-3">
    <div class="card shadow-sm p-4 border-1 col-11 col-md-5" style="border-radius: 14px">
      <!-- Status -->
      <div class="text-center mb-3">
        <i class="ti ti-circle-check text-success" style="font-size: 56px"></i>
        <h1 class="mt-3 mb-1 fw-bold">Compra concluída com sucesso</h1>
        <h4 class="text-muted mb-0">O seu acesso ao curso está disponível.</h4>
      </div>

      <!-- Dados -->
      <div class="bg-light rounded p-3 mb-3">
        <div class="d-flex justify-content-between">
          <span class="text-muted">Compra</span>
          <b>{{ checkout.orderCode }}</b>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted">Pagamento</span>
          <b>{{ checkout.paymentCode }}</b>
        </div>
        <div class="d-flex justify-content-between">
          <span class="text-muted">Data</span>
          <b>{{ toData(checkout.paid_at) }}</b>
        </div>
      </div>
      <!-- Mensagens de acesso -->
      <!-- Mensagens de acesso -->
      <!-- Mensagens de acesso -->
      <div class="mb-3">
        <!-- Primeiro acesso -->
        <div class="alert alert-success p-3 mb-2">
          <div class="row">
            <div class="">
              <strong>Primeira vez ?: </strong>
              Use as credenciais a baixo
            </div>
            <div class="my-2">
              <strong>Login:</strong> seu e-mail<br />
              <strong>Senha:</strong> A senha será enviada por e-mail ou poderá defini-la clicando
              em <strong>“Esqueceu a senha?”</strong>.
            </div>

            <div>
              Aceda em:
              <a
                href="https://www.academiatreesix.com/users/sign_in"
                target="_blank"
                class="text-primary"
              >
                academiatreesix.com
              </a>
            </div>

            <div>Após efectuar o login, aceda à opção <strong>O meu painel </strong>.</div>
          </div>
        </div>

        <!-- Acesso existente -->
        <div class="alert alert-primary p-3">
          <div class="row">
            <div>
              <strong>Já comprou cursos anteriormente:</strong>
            </div>

            <div>
              Entre com o seu e-mail em:
              <a href="https://www.academiatreesix.com/users/sign_in" target="_blank">
                academiatreesix.com
              </a>
            </div>

            <div>Após efectuar o login, aceda à opção <strong>O meu painel </strong>.</div>
          </div>
        </div>
      </div>

      <!-- CTA principal -->
      <div class="d-grid mb-2">
        <a
          href="https://www.academiatreesix.com/users/sign_in"
          target="_blank"
          class="btn btn-primary btn-lg d-flex align-items-center justify-content-center"
        >
          <i class="ti ti-player-play me-2"></i>
          Começar o curso
        </a>
      </div>

      <!-- Ações secundárias -->
      <div class="d-grid gap-2">
        <button
          :disabled="busyPrint"
          class="btn btn-outline-primary d-flex align-items-center justify-content-center"
          @click="handlePrint"
        >
          <IconPrinter class="me-2" :size="18" />
          {{ busyPrint ? 'A imprimir recibo...' : 'Imprimir recibo' }}
        </button>

        <button
          class="btn btn-outline-secondary d-flex align-items-center justify-content-center"
          @click="done"
        >
          <IconUserPlus class="me-2" :size="18" />
          Nova inscrição
        </button>
      </div>
    </div>
  </div>

  <iframe id="iframeRecibo" style="display: none"></iframe>
</template>
