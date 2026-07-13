<template>
  <div>
    <Bheader/>
    <div class="bg-white py-3 d-none d-md-block">
      <StepProgress
        @to="handleStepTo"
        :steps="stepsLabels"
        :step="currentStep"
      />
    </div>

    <div class="page-wrapper">
      <div class="container-xl relative mt-5">
        <template v-if="showGlobalError">
          <div class="page-body">
            <div class="row justify-content-center align-items-center" style="min-height: 100px;">
              <div class="col-md-12">
                <div class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                  <span>Não conseguimos carregar as promoções.</span>
                  <button class="btn btn-sm btn-light" @click="startCheckout(courseSlug)">Tentar novamente</button>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <template v-if="busyGlobal" key="loading">
            <div class="row mb-5">
              <!-- Left column -->
              <div class="col-12 col-md-3">
                <SkeletonLoader height="64px" class="mb-3"/>
                <SkeletonLoader height="64px" class="mb-3"/>
                <SkeletonLoader height="300px" class="mb-3"/>
              </div>

              <!-- Middle column -->
              <div class="col-md-6">
                <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                  <SkeletonLoader height="614px" class="mb-3"/>
                </div>
              </div>

              <!-- Right column -->
              <div class="col-md-3">
                <SkeletonLoader height="400px" class="mb-3"/>
              </div>
            </div>
          </template>
          <template v-else key="content">
            <!-- Mobile: página única -->
            <div class="d-md-none">
              <template v-if="currentStep < 2">
                <CheckoutForm key="checkout-form" />
              </template>
              <template v-else>
                <div class="page-body">
                  <Step3 @done="handleDone" key="step3-mobile" />
                </div>
              </template>
            </div>
            <!-- Desktop: wizard multi-step -->
            <div class="d-none d-md-block">
              <div class="page-body">
                <template v-if="currentStep === 0">
                  <Step1 key="step1"/>
                </template>
                <template v-if="currentStep === 1">
                  <Step2 key="step2"/>
                </template>
                <template v-if="currentStep === 2">
                  <Step3 @done="handleDone" key="step3"/>
                </template>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>

</template>
<script setup lang="ts">
// -------------------------------
//  Imports principais
// -------------------------------
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'

// -------------------------------
//  Imports de componentes
// -------------------------------
import Bheader from '@/modules/checkout/common/presentation/components/Bheader.vue'
import StepProgress from '@/modules/checkout/common/presentation/components/StepProgress.vue'
import SkeletonLoader from '@/modules/checkout/common/presentation/components/SkeletonLoader.vue'
import Step1 from '@/modules/checkout/common/presentation/components/steps/Step1.vue'
import Step2 from '@/modules/checkout/common/presentation/components/steps/Step2.vue'
import Step3 from '@/modules/checkout/common/presentation/components/steps/Step3.vue'
import CheckoutForm from '@/modules/checkout/common/presentation/components/steps/CheckoutForm.vue'

// -------------------------------
//  Stores (Pinia)
// -------------------------------
import { useCheckoutStore, useStepStore } from '@/modules/checkout/common/presentation/store/checkout'

// Instâncias dos stores
const checkoutStore = useCheckoutStore()
const stepStore = useStepStore()

const handleDone = () => {
  stepStore.stepReset();
}
const handleStepTo = (index) => {
  stepStore.stepTo(index);
}
// -------------------------------
// Extração de estados reativos
// -------------------------------
const { currentStep} = storeToRefs(stepStore)  // controle de passos
const { busyGlobal, showGlobalError } = storeToRefs(checkoutStore)                  // estado de carregamento

// -------------------------------
// ️ Métodos e ações dos stores
// -------------------------------
const { stepsLabels } = stepStore                                 // navegação entre passos
const { loadPromotions, loadCart, applyCoupon, setCoupon } = checkoutStore                     // carregamento de promoções

// -------------------------------
//  Roteamento
// -------------------------------
const route = useRoute()
const courseSlug = route.params.course as string | undefined

const hasCoupon = route.query.coupon as string | undefined
const startCheckout = () => {

  if (route.path.startsWith("/cart/")) {
    loadCart(route.params.order as string)
    return;
  }
  loadPromotions(courseSlug)
  if (hasCoupon) {
    setCoupon(hasCoupon)
    return;
  }
}
// -------------------------------
// Lifecycle hook
// -------------------------------
onMounted(() => {
  startCheckout();
})
</script>


<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
  position: absolute;
  width: 100%;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
