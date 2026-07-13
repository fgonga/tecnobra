<template>
  <div class="container-sm py-3">
    <!-- Course card -->
    <div class="card mb-3" v-if="checkout.course">
      <img
        class="card-img-top"
        :src="checkout.course.course_card_image_url"
        alt="Curso"
        style="max-height: 160px; object-fit: cover"
      />
      <div class="card-body py-2">
        <h5 class="card-title mb-1">{{ checkout.course.name }}</h5>
        <span class="text-muted small">{{ toMoney(checkout.price) }} Kz / acesso</span>
      </div>
    </div>

    <!-- Quantidade + cupom -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <label class="form-label mb-1 small fw-semibold">Quantidade</label>
        <div class="input-group w-100">
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="checkout.quantity = Math.max(1, Number(checkout.quantity) - 1)"
            :disabled="checkout.quantity <= 1 || awaitingPayment || busyRequest"
          >
            −
          </button>
          <input
            type="number"
            min="1"
            step="1"
            v-model="checkout.quantity"
            :class="['form-control text-center', { 'is-invalid': v$.quantity.$invalid }]"
            :disabled="awaitingPayment || busyRequest"
          />
          <button
            class="btn btn-outline-secondary"
            type="button"
            @click="checkout.quantity = Number(checkout.quantity) + 1"
            :disabled="awaitingPayment || busyRequest"
          >
            +
          </button>
        </div>
        <div class="mt-2 d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="store.toggleCoupon()"
            :disabled="awaitingPayment || busyRequest"
          >
            Tenho um cupom
          </button>
        </div>
        <Transition name="fade">
          <div v-if="showCouponInput" class="input-group mt-2">
            <input
              type="text"
              v-model="checkout.coupon_code"
              placeholder="Código do cupom"
              :disabled="busyCoupon"
              class="form-control"
            />
            <button
              type="button"
              class="btn btn-primary"
              :disabled="busyCoupon"
              @click="applyCoupon"
            >
              {{ busyCoupon ? 'Aplicando...' : 'Aplicar' }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Cards de estudantes -->
    <div v-for="(student, index) in checkout.students" :key="index" class="card mb-3">
      <div class="card-header py-2">
        <h6 class="card-title mb-0">{{ index + 1 }}º Acesso</h6>
      </div>
      <div class="card-body py-2">
        <input
          type="text"
          v-model="student.name"
          :class="[
            'form-control mb-2',
            {
              'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].name[0],
            },
          ]"
          placeholder="Nome completo"
          :disabled="awaitingPayment || busyRequest"
        />
        <input
          type="email"
          v-model="student.email"
          :class="[
            'form-control mb-2',
            {
              'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].email[0],
            },
          ]"
          placeholder="E-mail"
          :disabled="awaitingPayment || busyRequest"
        />
        <input
          type="tel"
          v-model="student.phone"
          :class="[
            'form-control',
            {
              'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].phone[0],
            },
          ]"
          placeholder="Telefone"
          :disabled="awaitingPayment || busyRequest"
        />
      </div>
    </div>

    <!-- Métodos de pagamento -->
    <div class="card mb-3">
      <div class="card-body py-2">
        <label class="form-label fw-semibold mb-2">Método de pagamento</label>
        <div class="row g-1">
          <div class="col-4" v-for="payment in payments" :key="payment.code">
            <button
              @click.prevent="checkout.paymentType = payment.code"
              class="card w-100 border"
              :class="{
                'border-primary': checkout.paymentType === payment.code,
                'bg-secondary-lt':
                  (awaitingPayment && checkout.paymentType !== payment.code) || payment.disabled,
              }"
              :disabled="awaitingPayment || payment.disabled"
            >
              <div class="card-body px-1 py-2 text-center">
                <span
                  class="avatar avatar-sm rounded mb-1"
                  :style="`background-image: url(/${payment.image})`"
                ></span>
                <div class="fw-medium" style="font-size: 0.7rem; line-height: 1.2">
                  {{ payment.name }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Número Express -->
        <div v-if="checkout.paymentType === 'express'" class="mt-3">
          <label class="form-label small">Número Multicaixa Express</label>
          <input
            type="tel"
            v-model="checkout.phone"
            :disabled="busyRequest || awaitingPayment"
            placeholder="9XXXXXXXX"
            :class="[
              'form-control',
              { 'is-invalid': vPhone$.phone.$dirty && vPhone$.phone.$invalid },
            ]"
            @blur="vPhone$.phone.$touch()"
          />
          <div
            v-for="err in vPhone$.phone.$errors"
            :key="err.$uid"
            class="invalid-feedback d-block"
          >
            {{ err.$message }}
          </div>
          <div
            v-if="checkout.students[0]?.phone && checkout.phone !== checkout.students[0].phone"
            class="mt-2"
          >
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              :disabled="busyRequest || awaitingPayment"
              @click="checkout.phone = checkout.students[0].phone"
            >
              Usar {{ checkout.students[0].phone }}
            </button>
          </div>
        </div>

        <!-- Referência: dados para pagar no Multicaixa/ATM (abaixo dos métodos) -->
        <div v-if="awaitingPayment && checkout.paymentType === 'ref' && referenceData" class="mt-3">
          <ReferenceDetails
            :entity="referenceData.entity"
            :reference-number="referenceData.referenceNumber"
            :amount="calculations.totalPay"
            :due-date="referenceData.dueDate"
          />
        </div>
      </div>
    </div>

    <!-- Erros de validação do formulário (antes do pagamento) -->
    <div ref="errorsRef"></div>
    <div
      v-if="showStudentError && !v$.students.$each.$response.$valid"
      class="alert alert-danger mb-2"
      role="alert"
    >
      <strong>Preencha os dados de todos os estudantes.</strong>
    </div>

    <!-- Resumo + estados de pagamento -->
    <div class="card mb-3">
      <div class="card-header py-2"><h6 class="card-title mb-0">Resumo</h6></div>
      <div class="card-body py-2">
        <div class="d-flex justify-content-between mb-1 small">
          <span>{{ checkout.course?.name }}</span>
          <span>{{ toMoney(checkout.price) }} Kz</span>
        </div>
        <div class="d-flex justify-content-between mb-1 small">
          <span>Acessos ({{ checkout.students.length }})</span>
          <span>{{ toMoney(calculations.realValue) }} Kz</span>
        </div>
        <div
          v-if="
            calculations.discountPromo + calculations.discountCoupon + calculations.discountCard > 0
          "
          class="d-flex justify-content-between mb-1 small text-success"
        >
          <span>Descontos</span>
          <span
            >-
            {{
              toMoney(
                calculations.discountPromo +
                  calculations.discountCoupon +
                  calculations.discountCard,
              )
            }}
            Kz</span
          >
        </div>
        <hr class="my-2" />
        <div class="d-flex justify-content-between fw-bold mb-3">
          <span>Total a pagar</span>
          <span class="text-primary">{{ toMoney(calculations.totalPay) }} Kz</span>
        </div>

        <!-- A processar -->
        <div v-if="busyRequest && !awaitingPayment">
          <div class="text-muted small mb-1">A processar...</div>
          <div class="progress" style="height: 4px; border-radius: 2px">
            <div
              class="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer sticky -->
    <div ref="footerRef">
      <!-- Estado: aguardando pagamento -->
      <div v-if="awaitingPayment">
        <!-- Express (e demais): contagem regressiva (a referência aparece no card de método) -->
        <template v-if="checkout.paymentType !== 'ref'">
          <ProgressCircle :countdown="countdown" :countime="59" />
          <div
            class="feedback-box text-center mb-2"
            :class="countdown <= 15 ? 'feedback-danger' : 'feedback-success'"
          >
            <div class="feedback-title">{{ countdown <= 15 ? 'Últimos segundos!' : 'Abre o Multicaixa Express' }}</div>
            <div class="feedback-desc">
              <template v-if="countdown <= 15">Autoriza o pagamento antes que expire.</template>
              <template v-else>Vai a "Operações por autorizar" e confirma.</template>
            </div>
          </div>
        </template>
        <!-- Erros / feedback do gateway -->
        <div v-if="validationError" class="feedback-box feedback-danger mb-2">
          <div class="feedback-header">
            <span class="feedback-title">Erro no pagamento</span>
            <a @click="validationError = null" class="btn-close" style="cursor: pointer"></a>
          </div>
          <div class="feedback-desc">{{ validationError }}</div>
        </div>
        <button class="btn btn-primary btn-md w-100" @click="checkPayment(true)">
          {{ checkout.paymentType === 'ref' ? 'Já paguei / Verificar pagamento' : 'Verificar pagamento' }}
        </button>
      </div>

      <!-- Estado: expirou / erro final -->
      <div v-else-if="validationError">
        <div class="feedback-box feedback-danger mb-2">
          <div class="feedback-header">
            <span class="feedback-title">Pagamento não processado</span>
            <a @click="validationError = null" class="btn-close" style="cursor: pointer"></a>
          </div>
          <div class="feedback-desc">{{ validationError }}</div>
        </div>
        <button class="btn btn-warning btn-md w-100" @click="handleRetry">Tentar novamente</button>
      </div>

      <!-- Estado: feedback antes de tentar novamente -->
      <div v-else-if="retryFeedback">
        <div class="feedback-box feedback-warning text-center mb-2">
          <div class="feedback-title">O seu pagamento expirou</div>
          <div class="feedback-desc">Vamos tentar novamente, por favor aguarde...</div>
        </div>
        <div class="progress" style="height: 6px; border-radius: 3px">
          <div class="progress-bar progress-bar-striped progress-bar-animated bg-warning w-100"></div>
        </div>
      </div>

      <!-- Estado: a processar -->
      <div v-else-if="busyRequest">
        <div class="feedback-box text-center mb-2" style="background: #f8f9fa; border-color: #dee2e6; color: #6c757d;">
          <div class="feedback-title">A processar</div>
          <div class="feedback-desc">Aguarde um momento...</div>
        </div>
        <div class="progress" style="height: 4px; border-radius: 2px">
          <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
        </div>
      </div>

      <!-- Estado: normal -->
      <template v-else>
        <button class="btn btn-primary btn-lg w-100 py-2 fw-bold" style="font-size: 1.2rem;" @click="handlePay">Pagar agora</button>
        <p class="text-center mb-0 mt-1" style="font-size: 0.65rem; color: #bbb">
          Ao pagar aceitas os
          <a target="_blank" href="/terms-and-conditions" class="text-muted">Termos e Condições</a>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, nextTick, watch } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { requiredIf, numeric, minLength, maxLength, helpers } from '@vuelidate/validators'
import { storeToRefs } from 'pinia'
import {
  useCheckoutStore,
  useStepStore,
  usePaymentStore,
} from '@/modules/checkout/common/presentation/store/checkout'
import ProgressCircle from '@/modules/checkout/common/presentation/components/ProgressCircle.vue'
import ReferenceDetails from '@/modules/checkout/common/presentation/components/ReferenceDetails.vue'
import toMoney from '@common/application/utils/money.ts'
import payments from '@common/application/utils/payments.ts'

const store = useCheckoutStore()
const stepManager = useStepStore()
const paymentStore = usePaymentStore()

const { checkout, calculations, showStudentError, showCouponInput, busyCoupon, v$ } =
  storeToRefs(store)
const { applyCoupon } = store
const { currentStep } = storeToRefs(stepManager)
const { awaitingPayment, busyRequest, countdown, validationError, referenceData } =
  storeToRefs(paymentStore)
const { checkPayment, startSocket, stopSocket, startPayment } = paymentStore

const phoneRules = computed(() => ({
  phone: {
    required: helpers.withMessage(
      'Número é obrigatório',
      requiredIf(() => checkout.value.paymentType === 'express'),
    ),
    numeric: helpers.withMessage('Apenas números', numeric),
    minLength: helpers.withMessage('Mínimo 9 dígitos', minLength(9)),
    maxLength: helpers.withMessage('Máximo 9 dígitos', maxLength(9)),
  },
}))
const vPhone$ = useVuelidate(phoneRules, checkout)

const retryFeedback = ref(false)
const footerRef = ref<HTMLElement | null>(null)
const footerHeight = ref(0)
const errorsRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
}

async function handleRetry() {
  validationError.value = null
  retryFeedback.value = true
  scrollToBottom()
  await new Promise((resolve) => setTimeout(resolve, 3500))
  retryFeedback.value = false
  if (currentStep.value === 0) currentStep.value = 1
  await startPayment()
  scrollToBottom()
}

async function handlePay() {
  // Valida também o telefone Express antes de prosseguir
  const phoneValid = checkout.value.paymentType !== 'express' || await vPhone$.value.$validate()
  const canPay = await store.canGoToPaymentStep()
  if (!canPay || !phoneValid) {
    await nextTick()
    errorsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  if (currentStep.value === 0) currentStep.value = 1
  await startPayment()
  scrollToBottom()
}

onMounted(async () => {
  startSocket()
  // Sincroniza telefone Express com o do 1º estudante se ainda não foi preenchido
  if (!checkout.value.phone && checkout.value.students[0]?.phone) {
    checkout.value.phone = checkout.value.students[0].phone
  }
  await nextTick()
  // Garante que o validador começa sem erros visíveis
  vPhone$.value.$reset()
  if (footerRef.value) footerHeight.value = footerRef.value.offsetHeight
})
onUnmounted(() => stopSocket())

// Sincroniza automaticamente o telefone Express quando o utilizador preenche o 1º estudante
watch(
  () => checkout.value.students[0]?.phone,
  (newPhone) => {
    if (newPhone && !checkout.value.phone) {
      checkout.value.phone = newPhone
    }
  }
)
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.checkout-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #dee2e6;
  padding: 10px 16px 14px;
  z-index: 100;
}
</style>
