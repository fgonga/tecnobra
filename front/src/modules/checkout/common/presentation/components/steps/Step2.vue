<template>
  <div class="row">
    <div class="col-md-12 mb-5" v-if="isDev">
      <div class="mt-4 p-3 bg-light rounded border">
        <div class="d-flex justify-content-between align-items-center my-2">
          <h6 class="fw-semibold">Logs:</h6>
          <div>
            <b-button variant="secondary" sm @click="logsClear">Limpar</b-button>
            <b-button class="mx-2" variant="primary" sm @click="devAprovePayment"
              >Aprovar pagamento</b-button
            >
            <b-button variant="danger" sm @click="devRecusePayment">Recusar pagamento</b-button>
          </div>
        </div>
        <pre style="max-height: 300px; overflow-y: auto">{{ logsData.join('\n') }}</pre>
      </div>
    </div>
    <div class="col-md-9">
      <div class="card mb-4">
        <div class="card-body text-center">
          <div class="d-flex flex-wrap justify-content-center">
            <div class="col-md-12">
              <div>
                <div class="row">
                  <div class="col-md-4" v-for="payment in availablePayments" :key="payment.code">
                    <button
                      @click.prevent="checkout.paymentType = payment.code"
                      class="card w-100 mt-2"
                      :class="{
                        'card-active': checkout.paymentType === payment.code,
                        'bg-secondary-lt':
                          (awaitingPayment && checkout.paymentType !== payment.code) ||
                          payment.disabled,
                        'bg-gray': !(checkout.paymentType === payment.code),
                      }"
                      :role="payment.disabled ? '' : 'button'"
                      :title="payment.disabled ? 'Método de pagamento desativado, use outro' : ''"
                      :disabled="awaitingPayment || payment.disabled"
                    >
                      <div class="card-body px-2 py-2">
                        <div class="row align-items-center">
                          <div class="col-auto">
                            <span
                              class="avatar avatar-2 rounded"
                              :style="`background-image: url(/${payment.image})`"
                            ></span>
                          </div>
                          <div class="col">
                            <div class="fw-medium text-start">{{ payment.name }}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-12 py-2"></div>
            <div id="payment-section w-100">
              <div
                class="col-md-12 d-flex justify-content-center align-items-center flex-wrap mt-5"
              >
                <template v-if="checkout.paymentType === 'express'">
                  <div class="d-flex justify-content-center flex-wrap mb-3 col-12 col-md-5">
                    <template v-if="busyRequest">
                      <SpinnerCircle mode="loading" />
                    </template>
                    <template v-if="awaitingPayment">
                      <ProgressCircle :countdown="countdown" :countime="59" />
                    </template>
                    <template v-if="!awaitingPayment && !busyRequest">
                      <ProgressCircle :countdown="59" :countime="59" />
                    </template>

                    <div
                      v-if="awaitingPayment"
                      class="feedback-box w-100 mb-3 text-center"
                      :class="countdown <= 15 ? 'feedback-danger' : 'feedback-success'"
                    >
                      <div class="feedback-title">
                        {{ countdown <= 15 ? 'Últimos segundos!' : 'Abre o Multicaixa Express' }}
                      </div>
                      <div class="feedback-desc">
                        {{
                          countdown <= 15
                            ? 'Autoriza o pagamento agora antes que expire.'
                            : 'Vai a "Operações por autorizar" e confirma o pagamento.'
                        }}
                      </div>
                    </div>

                    <div
                      v-if="retryFeedback"
                      class="feedback-box feedback-warning w-100 mb-2 text-center"
                    >
                      <div class="feedback-title">O seu pagamento expirou</div>
                      <div class="feedback-desc">Vamos tentar novamente, por favor aguarde...</div>
                    </div>

                    <div v-if="validationError" class="feedback-box feedback-danger w-100 mb-2">
                      <div class="feedback-header">
                        <span class="feedback-title">Pagamento não processado</span>
                        <a
                          @click="validationError = ''"
                          class="btn-close"
                          style="cursor: pointer"
                        ></a>
                      </div>
                      <div class="feedback-desc">{{ validationError }}</div>
                    </div>

                    <form class="w-100">
                      <div class="w-100">
                        <label class="form-label">Número de Telefone (Multicaixa Express)</label>
                        <div class="mb-2 w-100">
                          <input
                            type="tel"
                            v-model="checkout.phone"
                            :disabled="busyRequest || awaitingPayment"
                            placeholder="9XXXXXXXX"
                            :class="[
                              'form-control w-100',
                              { 'is-invalid': v$.phone.$dirty && v$.phone.$invalid },
                            ]"
                            @blur="v$.phone.$touch()"
                          />
                          <div
                            v-for="err in v$.phone.$errors"
                            :key="err.$uid"
                            class="invalid-feedback d-block"
                          >
                            {{ err.$message }}
                          </div>
                        </div>
                      </div>
                    </form>
                    <div class="w-100" v-if="awaitingPayment">
                      <b-button
                        class="btn btn-md btn-primary mb-2 w-100"
                        @click="checkPayment(true)"
                        variant="info"
                        >Verificar pagamento</b-button
                      >
                    </div>
                    <div class="w-100" v-if="!awaitingPayment && !retryFeedback">
                      <b-button
                        :disabled="awaitingPayment || busyRequest"
                        class="btn btn-md btn-primary mb-2 w-100"
                        @click="handlePay"
                        variant="primary"
                        >Pagar</b-button
                      >
                      <span class="small"
                        >Ao clicar em <strong>Pagar</strong>, você concorda com os <br /><a
                          target="_blank"
                          role="button"
                          href="/terms-and-conditions"
                          >Termos e Condições</a
                        >.</span
                      >
                    </div>
                  </div>
                </template>
                <template v-else-if="checkout.paymentType === 'qr'">
                  <template v-if="!busyRequest && !awaitingPayment">
                    <div class="d-flex justify-content-center align-items-center flex-wrap">
                      <div class="text-center p-3 rounded-3 my-auto">
                        <div class="d-flex flex-column align-items-center justify-content-center">
                          <div class="mb-3">
                            <IconQrcode size="110" color="#4429f2" />
                          </div>
                          <div class="w-100">
                            <b-button
                              class="btn btn-md btn-primary mb-2 w-100"
                              @click="stepNext"
                              variant="primary"
                              >Gerar código QR</b-button
                            >
                            <span class="small"
                              >Ao clicar em <strong>Gerar código QR</strong>, você concorda com os
                              <br /><a target="_blank" role="button" href="/terms-and-conditions"
                                >Termos e Condições</a
                              >.</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-if="busyRequest && !awaitingPayment">
                    <div class="d-flex justify-content-center align-items-center flex-wrap py-4">
                      <div class="text-center p-4">
                        <div class="d-flex flex-column align-items-center justify-content-center">
                          <div class="mb-3 position-relative">
                            <BSpinner
                              style="width: 5rem; height: 5rem"
                              class="align-middle mx-2 text-primary"
                            />
                          </div>
                          <h3 class="text-secondary mb-1 w-100 fw-medium">
                            <span class="text-dark fw-semibold">Gerando código QR...</span>
                          </h3>
                          <p class="text-muted small mb-0">
                            Aguarde alguns segundos até o código ser exibido.
                          </p>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-if="!busyRequest && awaitingPayment">
                    <div class="d-flex justify-content-center align-items-center flex-wrap">
                      <div
                        class="position-relative d-flex justify-content-center align-items-center"
                        style="width: 70%; aspect-ratio: 1/1"
                      >
                        {{ checkout.paymentCode }}
                        <img
                          v-if="qrCodeData"
                          :src="`data:image/png;base64,${qrCodeData}`"
                          alt="QR Code"
                          style="object-fit: contain; z-index: 1; width: 100%"
                        />
                      </div>
                      <div>
                        <p class="text-center text-secondary w-100">
                          Use o Multicaixa Express para escanear o código.
                        </p>
                        <div class="w-100" v-if="awaitingPayment">
                          <b-button
                            class="btn btn-md btn-primary mb-2 w-100"
                            @click="checkPayment(true)"
                            variant="info"
                          >
                            Verificar pagamento</b-button
                          >
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
                <template v-else-if="checkout.paymentType === 'ref'">
                  <div class="d-flex justify-content-center flex-wrap mb-3 col-12 col-md-6 w-100">
                    <template v-if="busyRequest">
                      <SpinnerCircle mode="loading" />
                    </template>

                    <div v-if="validationError" class="feedback-box feedback-danger w-100 mb-2">
                      <div class="feedback-header">
                        <span class="feedback-title">Pagamento não processado</span>
                        <a
                          @click="validationError = ''"
                          class="btn-close"
                          style="cursor: pointer"
                        ></a>
                      </div>
                      <div class="feedback-desc">{{ validationError }}</div>
                    </div>

                    <template v-if="awaitingPayment && referenceData">
                      <ReferenceDetails
                        :entity="referenceData.entity"
                        :reference-number="referenceData.referenceNumber"
                        :amount="calculations.totalPay"
                        :due-date="referenceData.dueDate"
                      />
                      <div class="w-100">
                        <b-button
                          class="btn btn-md btn-primary mb-2 w-100"
                          @click="checkPayment(true)"
                          variant="info"
                          >Já paguei / Verificar pagamento</b-button
                        >
                      </div>
                    </template>

                    <div class="w-100" v-if="!awaitingPayment">
                      <b-button
                        :disabled="busyRequest"
                        class="btn btn-md btn-primary mb-2 w-100"
                        @click="handlePay"
                        variant="primary"
                        >Gerar referência</b-button
                      >
                      <span class="small d-block text-center"
                        >Ao clicar em <strong>Gerar referência</strong>, você concorda com os
                        <br /><a target="_blank" role="button" href="/terms-and-conditions"
                          >Termos e Condições</a
                        >.</span
                      >
                    </div>
                  </div>
                </template>
              </div>
              <div class="w-100" v-if="checkout.paymentType === 'express'">
                <div class="w-100">
                  <h2 class="text-center">Como pagar no multicaixa express?</h2>
                </div>
                <hr class="my-3" />
                <div class="row">
                  <div class="col-6 col-md-4">
                    <p>1. Operações por autorizar</p>
                    <img class="px-5" src="/express/iphone1.png" alt="Passo 1" />
                  </div>
                  <div class="col-6 col-md-4">
                    <p>2. Clique na primeira opção</p>
                    <img class="px-5" src="/express/iphone2.png" alt="Passo 2" />
                  </div>
                  <div class="col-6 mt-2 mt-md-0 col-md-4">
                    <p>3. Confirme o pagamento</p>
                    <img class="px-5" src="/express/iphone3.png" alt="Passo 3" />
                  </div>
                </div>
              </div>
              <div class="w-100" v-if="checkout.paymentType === 'qr'">
                <div class="w-100">
                  <h2 class="text-center">Como pagar no multicaixa express?</h2>
                </div>
                <hr class="my-3" />
                <div class="d-flex justify-content-center align-items-center">
                  <div class="w-100">
                    <p>1. Operações por autorizar</p>
                    <img class="px-5" src="/qr/iphone1.png" alt="Passo 1" />
                  </div>
                  <div class="w-100">
                    <p>2. Clique na primeira opção</p>
                    <img class="px-5" src="/qr/iphone2.png" alt="Passo 2" />
                  </div>
                  <div class="w-100">
                    <p>3. Confirme o pagamento</p>
                    <img class="px-5" src="/qr/iphone3.png" alt="Passo 3" />
                  </div>
                </div>
              </div>
              <!-- TODO: reativar (trocar v-if="false" por v-if="checkout.paymentType === 'ref'")
                   quando houver as imagens próprias do fluxo de referência. -->
              <div class="w-100" v-if="false">
                <div class="w-100">
                  <h2 class="text-center">Como pagar com referência?</h2>
                </div>
                <hr class="my-3" />
                <div class="row">
                  <div class="col-6 col-md-4">
                    <p>1. Operações por autorizar</p>
                    <img class="px-5" src="/express/iphone1.png" alt="Passo 1" />
                  </div>
                  <div class="col-6 col-md-4">
                    <p>2. Clique na primeira opção</p>
                    <img class="px-5" src="/express/iphone2.png" alt="Passo 2" />
                  </div>
                  <div class="col-6 mt-2 mt-md-0 col-md-4">
                    <p>3. Confirme o pagamento</p>
                    <img class="px-5" src="/express/iphone3.png" alt="Passo 3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <Resume />
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconQrcode } from '@tabler/icons-vue'
import Resume from '@/modules/checkout/common/presentation/components/Resume.vue'
import { onMounted, onUnmounted, computed, nextTick, ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { requiredIf, numeric, minLength, maxLength, helpers } from '@vuelidate/validators'
import {
  useCheckoutStore,
  useStepStore,
  usePaymentStore,
} from '@/modules/checkout/common/presentation/store/checkout'
import ProgressCircle from '@/modules/checkout/common/presentation/components/ProgressCircle.vue'
import SpinnerCircle from '@/modules/checkout/common/presentation/components/SpinnerCircle.vue'
import { storeToRefs } from 'pinia'
import UtilService from '@/modules/central/common/domain/services/UtilService'
import ReferenceDetails from '@/modules/checkout/common/presentation/components/ReferenceDetails.vue'
const checkoutStore = useCheckoutStore()
const paymentStore = usePaymentStore()
const stepManager = useStepStore()
const { stepNext } = stepManager
const retryFeedback = ref(false)
const { checkout, availablePayments, calculations } = storeToRefs(checkoutStore)
const { startSocket, stopSocket, startPayment, checkPayment, logsClear, countime } = paymentStore

const {
  logsData,
  qrCodeData,
  referenceData,
  countdown,
  showPaymentInputError,
  awaitingPayment,
  busyRequest,
  validationError,
} = storeToRefs(paymentStore)
/* Validação */
const rules = computed(() => ({
  phone: {
    required: helpers.withMessage(
      'Número é obrigatório',
      requiredIf(() => checkout.paymentType === 'express'),
    ),
    numeric: helpers.withMessage('Apenas números', numeric),
    minLength: helpers.withMessage('Mínimo 9 dígitos', minLength(9)),
    maxLength: helpers.withMessage('Máximo 9 dígitos', maxLength(9)),
  },
}))
const v$ = useVuelidate(rules, checkout)
// Computer is dev mode by .env
const isDev = computed(() => import.meta.env.VITE_DEV === 'true')

function scrollToPayment() {
  nextTick(() => {
    const el = document.querySelector('#payment-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

async function handlePay() {
  if (validationError.value) {
    validationError.value = ''
    retryFeedback.value = true
    scrollToPayment()
    await new Promise((resolve) => setTimeout(resolve, 3500))
    retryFeedback.value = false
  }
  scrollToPayment()
  stepNext()
}

onMounted(async () => {
  startSocket()
  checkout.value.phone = checkout.value.students[0].phone || ''
  await nextTick()
  scrollToPayment()
})
onUnmounted(() => stopSocket())

async function devAprovePayment() {
  await UtilService.devAprovePayment(checkout.value.paymentCode)
}
async function devRecusePayment() {
  await UtilService.devRecusePayment(checkout.value.paymentCode)
}
</script>

<style scoped>
.feedback-box {
  display: block;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
}
.feedback-title {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  text-align: center;
}
.feedback-desc {
  display: block;
  font-size: 0.82rem;
  opacity: 0.85;
  text-align: justify;
  text-align-last: center;
}
.feedback-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}
.feedback-header .feedback-title {
  flex: 1;
  text-align: center;
}
.feedback-success {
  background-color: #d1e7dd;
  border-color: #badbcc;
  color: #0f5132;
}
.feedback-warning {
  background-color: #fff3cd;
  border-color: #ffecb5;
  color: #664d03;
}
.feedback-danger {
  background-color: #f8d7da;
  border-color: #f5c2c7;
  color: #842029;
}
</style>
