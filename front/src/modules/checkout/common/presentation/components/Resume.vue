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
  -->
<template>

  <div class="card px-0 m-0">

    <div class="card-header py-2"><h3 class="card-title">Resumo</h3></div>
    <div class="card-body">
      <ul class="list-unstyled mb-3">
        <li v-if="checkout.course" class="d-flex justify-content-between align-items-center mb-2">
          <span>{{ checkout.course.name }}</span>
          <span><strong>{{ toMoney(checkout.price) }} Kz</strong></span>
        </li>
        <li class="d-flex justify-content-between align-items-center mb-2">
          <span>Acessos ({{ checkout.students.length }})</span>
          <span><strong>{{ toMoney(calculations.realValue) }} Kz</strong></span>
        </li>
        <li v-if="checkout.promotion_active" class="d-flex justify-content-between align-items-center mb-2">
          <span>Promoção </span>
          <span class="text-success">+{{ calculations.bonus }} acessos</span>
        </li>
        <li class="d-flex justify-content-between align-items-center mb-2">
          <span>Subtotal </span>
          <span><strong>{{ toMoney(calculations.realValue) }} Kz</strong></span>
        </li>
      </ul>
      <hr class="py-0 my-3">
      <div role="button" @click="showDiscountResume = !showDiscountResume" class="d-flex justify-content-between mb-2">
        <span class="text-muted">Descontos</span>
        <span>- {{ toMoney(calculations.discountPromo + calculations.discountCoupon + calculations.discountCard) }} Kz</span>
      </div>
      <ul v-if="showDiscountResume" class="list-unstyled mb-3">
        <li v-if="calculations.discountPromo" class="d-flex justify-content-between align-items-center mb-2 text-muted">
          <span class="ms-2">Promoções</span>
          <span><strong>{{ toMoney(calculations.discountPromo ) }} Kz</strong></span>
        </li>
        <li v-if="calculations.discountCoupon" class="d-flex justify-content-between align-items-center mb-2 text-muted">
          <span  class="ms-2"> Cupon</span>
          <span><strong>{{ toMoney(calculations.discountCoupon) }} Kz</strong></span>
        </li>
        <li v-if="calculations.discountCard" class="d-flex justify-content-between align-items-center mb-2 text-muted">
          <span  class="ms-2"> Cartão CEU</span>
          <span><strong>{{ toMoney(calculations.discountCard) }} Kz</strong></span>
        </li>
      </ul>
      <div class="d-flex justify-content-between mt-3 mb-3">
        <span class="fw-bold">Total a pagar</span>
        <span class="fw-bold text-primary">{{ toMoney(calculations.totalPay) }} Kz</span>
      </div>
      <template v-if="currentStep != 1">
        <b-button  :disabled="awaitingPayment || busyRequest"  type="button" variant="primary" class="w-100 mb-3" @click="stepNext">
          {{ btnText }}
        </b-button>
        <span v-if="showTerms" class="mt-4">Ao clicar em <strong>Pagar</strong>, você concorda com os <a target="_blank"  href="/terms-and-conditions">Termos e Condições</a>.</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import toMoney from "@common/application/utils/money.ts"
import { useCheckoutStore, useStepStore, usePaymentStore} from '@/modules/checkout/common/presentation/store/checkout'
import {computed, ref} from "vue";
import {storeToRefs} from "pinia";
const store = useCheckoutStore()
const stepManager = useStepStore()
const paymentStore = usePaymentStore()
const { stepNext } = stepManager
const { currentStep  } = storeToRefs(stepManager)
const { checkout,calculations  } = storeToRefs(store)
const {  awaitingPayment, busyRequest} = storeToRefs(paymentStore)
const btnText = computed(() => currentStep.value === 0 ? 'Próximo' : 'Pagar');
const showTerms = computed(() => currentStep.value == 1);
const showDiscountResume = ref(false);
</script>

