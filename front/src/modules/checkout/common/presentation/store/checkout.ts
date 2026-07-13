import {defineStore} from 'pinia'
import {computed, nextTick, reactive, ref, watch} from 'vue'
import type {Checkout} from '@/dtos'
import {CheckoutCalculator} from '@/modules/checkout/common/domain/services/CheckoutCalculator'
import checkoutService from '@/modules/checkout/common/domain/services/checkout'
import notification from '@/common/application/utils/notification'
import paymentsCatalog from '@common/application/utils/payments'
import {useVuelidate} from '@vuelidate/core'
import {email, helpers, minLength} from '@vuelidate/validators'
import {required} from '@common/application/utils/validators.ts'
import { io, Socket } from 'socket.io-client'
import {storeToRefs} from "pinia";

// =========================================================
//  Store: useCheckoutStore
// =========================================================

export const useCheckoutStore = defineStore('checkout', () => {

  // ---------------------------------------------------------
  //  Estado principal (estado base da aplicação)
  // ---------------------------------------------------------

  const showStudentError = ref(false)
  const showCouponInput = ref(false)
  const showCardInput = ref(false)
  const busyCoupon = ref(false)
  const busyCard = ref(false)
  const busyGlobal = ref(false)
  const showGlobalError = ref(false)

  // Estrutura base do checkout
  const checkout = reactive<Checkout>({
    students: [ { name: '', email: '', phone: '' }],
    paymentType: 'express',
    agree: false,
    price: 0,
    quantity: 1,
    bonus: 0,
    subtotal: 0,
    realValue: 0,
    discount: 0,
    totalPay: 0,
    phone: '',
    promotion_active: false,
    promotion_quantity: 0,
    promotion_quantity_max: 0,
    orderCode: null,
    paymentCode: null,
    course: null,
    coupon_code: null,
    card_code: null,
    coupon: null,
    card: null,
    discountPromo: 0,
    discountCoupon: 0,
    paid_at: null,
  })

  // ---------------------------------------------------------
  //  Cálculos derivados (computed properties)
  // ---------------------------------------------------------
  const calculations = computed(() => CheckoutCalculator.calculate(checkout))

  // ---------------------------------------------------------
  //  Configuração do gateway de pagamentos (vinda da config)
  // ---------------------------------------------------------
  const paymentConfig = reactive({
    express_enabled: true,
    ref_enabled: true,
    qr_enabled: true,
    default_payment_method: 'express',
    reference_expiration_minutes: 1440,
  })

  // Mostra todos os métodos; os desativados na config aparecem em cinza (disabled) e vão para o fim
  const availablePayments = computed(() =>
    paymentsCatalog
      .map((p) => ({
        ...p,
        disabled: !(paymentConfig as any)[`${p.code}_enabled`],
      }))
      .sort((a, b) => Number(a.disabled) - Number(b.disabled))
  )

  // Sincroniza a config do gateway e pré-seleciona o método padrão
  function applyPaymentConfig(data: any) {
    if (!data) return
    if (data.express_enabled !== undefined) paymentConfig.express_enabled = !!data.express_enabled
    if (data.ref_enabled !== undefined) paymentConfig.ref_enabled = !!data.ref_enabled
    if (data.qr_enabled !== undefined) paymentConfig.qr_enabled = !!data.qr_enabled
    if (data.default_payment_method) paymentConfig.default_payment_method = data.default_payment_method
    if (data.reference_expiration_minutes) paymentConfig.reference_expiration_minutes = Number(data.reference_expiration_minutes)

    const enabledOf: Record<string, boolean> = {
      express: paymentConfig.express_enabled,
      ref: paymentConfig.ref_enabled,
      qr: paymentConfig.qr_enabled,
    }
    const preferred = paymentConfig.default_payment_method
    checkout.paymentType = enabledOf[preferred]
      ? preferred
      : (Object.keys(enabledOf).find((k) => enabledOf[k]) || 'express')
  }

  // ---------------------------------------------------------
  // ️ Ações principais (lógica e operações do store)
  // ---------------------------------------------------------

  // Carrega promoções de um curso

  async function loadPromotions(courseSlug?: string) {
    busyGlobal.value = true
    showGlobalError.value = false
    try {
      const { data } = await checkoutService.configurations({ course: courseSlug })
      Object.assign(checkout, {
        course: data.course,
        price: data.course.price,
        promotion_active: data.promotion_active,
        promotion_quantity: data.promotion_quantity,
        promotion_quantity_max: data.promotion_quantity_max,
      })
      applyPaymentConfig(data)
    } catch {
      showGlobalError.value = true
    } finally {
      busyGlobal.value = false
    }
  }

  async function loadCart(orderCode?: string) {
    busyGlobal.value = true
    showGlobalError.value = false
    try {
      const { data } = await checkoutService.getCart(orderCode)
      await loadPromotions(data.course.slug)
      checkout.quantity = data.quantity
      checkout.students = data.customers.map(s => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
      }))
    } catch {
      showGlobalError.value = true
    } finally {
      busyGlobal.value = false
    }
  }
  // ---------------------------------------------------------
  //  Validação (usando Vuelidate)
  // ---------------------------------------------------------
  const rules = computed(() => ({
    students: {
      $each: helpers.forEach({
        name: {
          required: helpers.withMessage('Nome é obrigatório', required),
          minLength: helpers.withMessage('Nome curto', minLength(3)),
        },
        email: {
          required: helpers.withMessage('Email é obrigatório', required),
          email: helpers.withMessage('Email inválido', email),
        },
        phone: {
          required: helpers.withMessage('Telefone é obrigatório', required),
          minLength: helpers.withMessage('Telefone curto', minLength(9)),
        },
      }),
    },
    quantity: { required },
  }))

  const v$ = useVuelidate(rules, checkout)

  // Verifica se é possível avançar para o passo de pagamento
  async function canGoToPaymentStep(): Promise<boolean> {
    showStudentError.value = true
    // Marca todos os campos como dirty para exibir erros no template
    v$.value.$touch()
    // Validação explícita (mais fiável que $validate() em contexto Pinia store)
    const studentsValid = checkout.students.every(student => {
      const nameOk = (student.name?.trim() ?? '').length >= 3
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email ?? '')
      const phoneOk = (student.phone?.replace(/\D/g, '') ?? '').length >= 9
      return nameOk && emailOk && phoneOk
    })
    const quantityOk = Number(checkout.quantity) >= 1
    return studentsValid && quantityOk
  }

  // Verifica se há erro num aluno específico
  function hasError(index: number) {
    const fields = ['name', 'phone', 'email']
    return fields.some(f => v$.value.students?.$each?.$response?.$data?.[index]?.[f]?.$error)
  }

  // Oculta mensagens de erro
  function hideErrors() {

  }

  // ---------------------------------------------------------
  //  Cupões
  // ---------------------------------------------------------
  // Alterna o campo de cupão
  function toggleCoupon() {
    if (showCouponInput.value) {
      checkout.coupon = null
      checkout.coupon_code = null
    }
    showCouponInput.value = !showCouponInput.value
  }
  function toggleCard() {
    if (showCardInput.value) {
      checkout.card = null
      checkout.card_code = null
    }
    showCardInput.value = !showCardInput.value
  }

  // Aplica cupão se existir
  async function applyCoupon() {
    if (!checkout.coupon_code) return
    if (busyCoupon.value) return
    busyCoupon.value = true
    try {
      const { data } = await checkoutService.getCoupon(checkout.coupon_code)
      checkout.coupon = data
      notification.success('Cupão aplicado com sucesso')
    } finally {
      busyCoupon.value = false
    }
  }
  async function setCoupon(code: string) {
    checkout.coupon_code = code
    showCouponInput.value = true
    await applyCoupon()
  }
  async function applyCard() {
    if (!checkout.card_code) return
    if (busyCard.value) return
    busyCard.value = true
    try {
      const { data } = await checkoutService.getCard(checkout.card_code)
      console.log(data)
      checkout.card = data
      notification.success('Cartão e desconto aplicado com sucesso')
    } finally {
      busyCard.value = false
    }
  }

  // ---------------------------------------------------------
  // ️ Reset do checkout
  // ---------------------------------------------------------
  function resetCheckout() {
    busyCoupon.value = false
    busyCard.value = false
    showCouponInput.value = false
    showCardInput.value = false
    const keep = {
      course: checkout.course,
      price: checkout.price,
      promotion_active: checkout.promotion_active,
      promotion_quantity: checkout.promotion_quantity,
      promotion_quantity_max: checkout.promotion_quantity_max,
    }
    Object.assign(checkout, {
      students: [ { name: '', email: '', phone: '' }],
      paymentType: 'express',
      agree: false,
      quantity: 1,
      bonus: 0,
      subtotal: 0,
      realValue: 0,
      discount: 0,
      totalPay: 0,
      phone: '',
      orderCode: null,
      paymentCode: null,
      coupon_code: null,
      card_code: null,
      coupon: null,
      card: null,
      discountPromo: 0,
      discountCoupon: 0,
      paid_at: null,
      ...keep,
    })

  }
  watch(
    () => checkout.quantity,
    (val) => {
      const totalAcessos = (Number(val) || 0) + calculations.value.bonus
      if (!Array.isArray(checkout.students)) {
        checkout.students = []
      }
      if (checkout.students.length < totalAcessos) {
        while (checkout.students.length < totalAcessos) {
          checkout.students.push({ name: '', email: '', phone: '' })
        }
      } else if (checkout.students.length > totalAcessos) {
        checkout.students.splice(totalAcessos)
      }
    }
  )

  // ---------------------------------------------------------
  //  Exportações (estado + ações)
  // ---------------------------------------------------------
  return {
    // Estado
    checkout,
    busyGlobal,
    showGlobalError,
    showStudentError,
    showCouponInput,
    busyCoupon,
    busyCard,
    // Computed
    calculations,
    showCardInput,
    paymentConfig,
    availablePayments,
    // Ações
    loadPromotions,
    loadCart,
    applyCoupon,
    applyCard,
    resetCheckout,
    canGoToPaymentStep,
    hasError,
    hideErrors,
    toggleCoupon,
    toggleCard,
    v$,
    setCoupon
  }
})
export const useStepStore  = defineStore('step', () => {
  /* ---------------------- estado principal ---------------------- */
  const currentStep = ref(0)
  const stepsLabels = ['Detalhes', 'Pagamento', 'Confirmação']
  const checkoutStore = useCheckoutStore()
  const paymentStore = usePaymentStore()
  async function stepNext() {
    if (currentStep.value == 0) {
      const canPay = await checkoutStore.canGoToPaymentStep()
      if (canPay){
        return currentStep.value++
      }else{
        notification.error('Preencha todos os campos corretamente antes de avançar.')
        return;
      }
    }
    if (currentStep.value === 1) {
      return await paymentStore.startPayment();
    }
    if (currentStep.value < 2) currentStep.value++
  }

  function stepDone() {
    if (currentStep.value < 2) currentStep.value++
  }
  function stepTo(to) {
    if (currentStep.value === 1 && to === 0){
      currentStep.value = to;
      return
    }
    notification.error('Não é possível voltar para este passo')
  }
  function stepReset() {
    checkoutStore.resetCheckout()
    currentStep.value = 0
  }
  function stepPrev() {
    if (currentStep.value > 0) currentStep.value--
  }
  return {
    currentStep,
    stepsLabels,
    stepNext,
    stepReset,
    stepDone,
    stepPrev,
    stepTo
  }
})
export const usePaymentStore = defineStore('payment', () => {
  const checkoutStore = useCheckoutStore()
  const stepStore = useStepStore()
  const { checkout } = storeToRefs(checkoutStore)
  // ---------------------------------------------------------
  // ️ Estado principal
  // ---------------------------------------------------------
  const busyRequest = ref(false)  // quando solicita pagamento
  const awaitingPayment = ref(false)  // quando aguarda aprovação
  const showPaymentInputError = ref(false)
  const validationError = ref<string | null>(null)
  const validationInfo = ref<string | null>(null)
  const qrCodeData = ref('')
  const referenceData = ref<{ entity: string; referenceNumber: string; dueDate: string } | null>(null)
  const countime = 59
  const countdown = ref(countime)
  const logsData = ref<string[]>([])
  let destroyed = false
  let socket: Socket | null = null
  let timer: number | null = null

  // ---------------------------------------------------------
  //  Utilitários de log
  // ---------------------------------------------------------
  function logsAdd(msg: string) {
    logsData.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
  }
  function logsClear() {
    logsData.value = []
  }

  // ---------------------------------------------------------
  //  Estado do pagamento
  // ---------------------------------------------------------
  function isPayed() {
    if (destroyed) return
    stopTimer()
    awaitingPayment.value = false
    logsAdd(' Pagamento confirmado com sucesso.')
    stepStore.stepDone()
  }

  function isCanceled(msg: string) {
    if (destroyed) return
    stopTimer()
    awaitingPayment.value = false
    validationError.value = msg
    logsAdd(` Pagamento cancelado: ${msg}`)
  }


  // ---------------------------------------------------------
  // ️ Contador / Timer
  // ---------------------------------------------------------
  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = countime
  }
  async function startTimer() {
    stopTimer()
    countdown.value = countime
    timer = setInterval(() => {
      if (destroyed) return stopTimer()
      if (countdown.value > 0) {
        countdown.value--
        if ([40, 30, 20, 10, 0].includes(countdown.value)) checkPayment()
      } else {
        stopTimer()
        if (awaitingPayment.value) {
          isCanceled('O prazo de pagamento expirou. Não recebemos confirmação.')
        }
      }
    }, 1000)
  }
  // Pagamento por referência: válido por horas (reference_expiration_minutes).
  // Não há countdown de 59s nem expiração — apenas verifica periodicamente
  // se o pagamento foi confirmado.
  function startReferencePolling() {
    stopTimer()
    timer = setInterval(() => {
      if (destroyed || !awaitingPayment.value) return stopTimer()
      checkPayment()
    }, 10000)
  }
  // ---------------------------------------------------------
  //  Verifica estado de pagamento (mock / real)
  // ---------------------------------------------------------
  function checkPayment(click = false) {
    if (destroyed || !checkout.value.paymentCode) return
    checkoutService.checkPayment(checkout.value.paymentCode)
      .then(({ data }) => {
        if (destroyed) return
        if (data.status === 'paid') return isPayed()
        if (data.status === 'failed') return isCanceled(data.message)
        if (click && data.status === 'pending')
          notification.error('Ainda não foi possível confirmar o pagamento. Aguarde alguns segundos.')
      })
  }

  // ---------------------------------------------------------
  //  Início do pagamento
  // ---------------------------------------------------------
  async function startPayment() {
    console.log(' Iniciando pagamento...')
    showPaymentInputError.value = false
    validationError.value = null
    qrCodeData.value = ''
    referenceData.value = null
    awaitingPayment.value = false
    busyRequest.value = false
    const c = checkout.value

    //  Validação local
    if (c.paymentType === 'express' && !c.phone) {
      showPaymentInputError.value = true
      validationError.value = 'O número de telefone é obrigatório.'
      return
    }

    if (c.paymentType === 'express' && !/^\d{9}$/.test(c.phone || '')) {
      showPaymentInputError.value = true
      validationError.value = 'Número de telefone inválido. Deve conter 9 dígitos.'
      return
    }

    try {
      const payload = {
        students: c.students,
        quantity: c.quantity,
        paymentType: c.paymentType,
        phone: c.phone,
        orderCode: c.orderCode,
        paymentCode: c.paymentCode,
        courseId: c.course?.id,
        couponId: c.coupon?.id,
        cardId: c.card?.id,
      }

      logsAdd('📨 Enviando solicitação de pagamento...')
      busyRequest.value = true
      const { data } = await checkoutService.done(payload)
      if (destroyed) return
      busyRequest.value = false

      logsAdd(' Pagar ...')
      logsAdd(' Encomenda: ' + data.orderCode)
      logsAdd(' Pagamento: ' + data.paymentCode)
      c.paymentCode = data.paymentCode
      c.orderCode = data.orderCode

      if (c.paymentType === 'qr' && data.qr) {
        qrCodeData.value = data.qr
        logsAdd(' QR Code recebido.')
      }
      if (c.paymentType === 'ref' && data.reference) {
        referenceData.value = data.reference
        logsAdd(' Referência gerada.')
      }
      awaitingPayment.value = true
      if (c.paymentType === 'ref') startReferencePolling()
      else startTimer()
      socket?.emit('join-payment', data.paymentCode)
      logsAdd(' Aguardando confirmação de pagamento...')

    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao iniciar o pagamento.'
      isCanceled(msg)
    } finally {
      busyRequest.value = false
    }
  }

  // ---------------------------------------------------------
  //  Socket
  // ---------------------------------------------------------
  function startSocket() {
    destroyed = false
    socket = io(import.meta.env.VITE_SOCKET_URL, { transports: ['websocket'] })
    socket.on('connect', () => logsAdd(` Conectado: ${socket?.id}`))
    socket.on('disconnect', () => logsAdd(' Desconectado'))
    socket.on('connect_error', err => logsAdd(`️ Erro: ${err.message}`))
    socket.on('payment-update', (data) => {
      if (destroyed) return
      logsAdd(` Atualização: ${JSON.stringify(data)}`)
      if (data.paymentId !== checkout.value.paymentCode){
        logsAdd('️ Código de pagamento inválido na atualização.')
        logsAdd(`Recebido: ${data.paymentId} | Esperado: ${checkout.value.paymentCode}`)
        return
      }
      if (data.success) {
        isPayed()
      } else {
        isCanceled(data.message)
      }
    })
  }
  function stopSocket() {
    destroyed = true
    stopTimer()
    if (socket) {
      socket.off()
      socket.disconnect()
      socket = null
    }
  }
  // ---------------------------------------------------------
  //  Export
  // ---------------------------------------------------------
  return {
    busyRequest,
    awaitingPayment,
    validationError,
    showPaymentInputError,
    qrCodeData,
    referenceData,
    countdown,
    countime,
    logsData,
    // Métodos
    logsAdd,
    logsClear,
    checkPayment,
    startPayment,
    startTimer,
    stopTimer,
    startSocket,
    stopSocket,
  }
})
