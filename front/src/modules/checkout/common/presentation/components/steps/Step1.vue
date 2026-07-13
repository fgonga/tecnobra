<template>
  <div class="row mb-5">
    <div class="col-12 col-md-3">
      <div class="w-100" v-if="checkout.course">
        <div class="card">
          <img class="card-img-top" :src="checkout.course.course_card_image_url" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">{{checkout.course.name}}</h5>
            <p class="card-text text-justify">{{checkout.course.description}} </p>
          </div>
          <div class="accordion" id="englishClubAccordion">
            <template v-if="checkout.course.levels">
              <div
                class="accordion-item"
                v-for="(level, i) in checkout.course.levels"
                :key="i"
              >
                <h4 class="accordion-header" :id="`heading-${i}`">
                  <button
                    class="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#collapse-${i}`"
                    aria-expanded="false"
                    :aria-controls="`collapse-${i}`"
                  >
                    {{ level.title }}
                  </button>
                </h4>
                <div
                  :id="`collapse-${i}`"
                  class="accordion-collapse collapse"
                  :aria-labelledby="`heading-${i}`"
                  data-bs-parent="#englishClubAccordion"
                >
                  <div class="accordion-body">
                    {{ level.description }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <div  v-if="showStudentError && !v$.students.$each.$response.$valid" class="alert alert-danger alert-dismissible" role="alert">
        <div  class="alert-icon">
          <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon alert-icon icon-2">
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
        </div>
        <div>
          <h4 class="alert-heading">Erros encontrados:</h4>
          <div class="alert-description">
            <ul class="alert-list mb-0">
              <template   v-for="(errs, idx) in checkout.students">
                <li
                  v-if="hasError(idx)"
                  :key="idx"
                >
                  <strong>{{ idx + 1 }}º Estudante</strong> <br>
                  <ul>
                    <li v-for="(msg, j) in v$.students.$each.$response.$errors[idx].name" :key="j">
                      {{ msg.$message }}
                    </li>
                    <li v-for="(msg, j) in v$.students.$each.$response.$errors[idx].email" :key="j">
                      {{ msg.$message }}
                    </li>
                    <li v-for="(msg, j) in v$.students.$each.$response.$errors[idx].phone" :key="j">
                      {{ msg.$message }}
                    </li>
                  </ul>
                </li>
              </template>
            </ul>
          </div>
        </div>
      </div>
      <div style="max-height: 800px; overflow-y: auto; padding-right: 8px;">
        <div v-for="(student, index) in checkout.students" :key="index" class="card mb-4">
          <div class="card-header py-2">
            <h3 class="card-title">{{ index + 1 }}ª Estudante</h3>
          </div>
          <div class="card-body">
            <!-- Nome -->
            <div class="mb-2">
              <label class="form-label">Nome</label>
              <div
                :class="[
    'input-icon',
    { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].name[0] }
  ]"
              >
                <span class="input-icon-addon"><IconIdBadge2 size="18" /></span>
                <input
                  type="text"
                  v-model="student.name"
                  :class="[
      'form-control',
      { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].name[0] }
    ]"
                  placeholder="Nome completo"
                />
              </div>
              <div
                v-if="showStudentError"
                v-for="err in v$.students.$each.$response.$errors[index].name || []"
                class="invalid-feedback"
              >
                {{err.$message}}
              </div>
            </div>

            <!-- Email -->
            <div class="mb-2">
              <label class="form-label">E-mail</label>
              <div
                :class="[
                'input-icon',
                { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].email[0] }
              ]"
              >

                <span class="input-icon-addon"><IconMail size="18" /></span>
                <input
                  type="text"
                  v-model="student.email"
                  :class="[
      'form-control',
      { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].email[0] }
    ]"
                  placeholder="E-mail"
                />
              </div>
              <div
                v-if="showStudentError"
                v-for="err in v$.students.$each.$response.$errors[index].email || []"
                class="invalid-feedback"
              >
                {{err.$message}}
              </div>
            </div>


            <div class="mb-2">
              <label class="form-label">Telefone</label>
              <div
                :class="[
                'input-icon',
                { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].phone[0] }
              ]"
              >

                <span class="input-icon-addon"><IconMail size="18" /></span>
                <input
                  type="text"
                  v-model="student.phone"
                  :class="[
      'form-control',
      { 'is-invalid': showStudentError && v$.students.$each.$response.$errors[index].phone[0] }
    ]"
                  placeholder="Telefone"
                />
              </div>
              <div
                v-if="showStudentError"
                v-for="err in v$.students.$each.$response.$errors[index].phone || []"
                class="invalid-feedback"
              >
                {{err.$message}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-primary text-primary-fg mb-2" v-if="checkout.promotion_active">
        <div class="card-stamp">
          <div class="card-stamp-icon bg-white text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" class="icon icon-1">
              <path d="M12 2 L12 22 M2 12 L22 12" />
            </svg>
          </div>
        </div>
        <div class="card-body py-2 ">
          <h3 class="card-title mb-0">Promoção</h3>
          <p>Compre {{checkout.promotion_quantity}} e leve +1. <br>Acumule até {{checkout.promotion_quantity_max}} acessos grátis!</p>
        </div>
      </div>
      <div class="card shadow-sm border-0 mb-3">
        <div class="card-body">
          <label class="form-label fw-semibold text-secondary mb-1">Quantidade</label>
          <input
            type="number"
            min="1"
            step="1"
            v-model="checkout.quantity"
            placeholder="Insira a quantidade"
            :class="['form-control form-control-lg', { 'is-invalid': v$.quantity.$invalid }]"
          />
          <div v-for="err in v$.quantity.$errors || []" class="invalid-feedback">
            {{ err.$message }}
          </div>
          <div class="mt-3 d-flex flex-column flex-sm-row justify-content-end align-items-center">
            <!--
                  TEMPORARIAMENTE DESATIVADO.
                  <button
                          type="button"
                          class="btn btn-outline-primary btn-sm mb-2 mb-sm-0"
                          @click="handleToogleCard"
                        >
                          Tenho um cartão <b style="margin-left: 3px">CEU</b>
                        </button>-->
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              @click="handleToogleCoupon"
            >
              Tenho um cupom
            </button>
          </div>
          <Transition name="fade">
            <div v-if="showCouponInput" class="mt-3">
              <div class="input-group">
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
            </div>
          </Transition>
          <Transition name="fade">
            <div v-if="showCardInput" class="mt-3">
              <div class="input-group">
                <input
                  type="text"
                  v-model="checkout.card_code"
                  placeholder="Código do cartão CEU"
                  :disabled="busyCard"
                  class="form-control"
                />
                <button
                  type="button"
                  class="btn btn-primary"
                  :disabled="busyCard"
                  @click="handleApplyCard"
                >
                  {{ busyCard ? 'Aplicando...' : 'Aplicar' }}
                </button>
              </div>
              <span v-if="checkout.card" class=" text-muted mt-2">Estudante: {{checkout?.card?.name}}</span>
            </div>
          </Transition>
        </div>
      </div>
      <Resume/>
    </div>
  </div>
</template>
<script setup lang="ts">
import { IconIdBadge2, IconPhone, IconMail } from '@tabler/icons-vue'
import { ref, computed } from 'vue'
import { useCheckoutStore } from '@/modules/checkout/common/presentation/store/checkout'
import Resume from '@/modules/checkout/common/presentation/components/Resume.vue'
import {storeToRefs} from "pinia";
const store = useCheckoutStore()
const {  applyCoupon, applyCard, hasError, toggleCoupon, toggleCard } = store
let { showCouponInput,showCardInput, showStudentError, busyCoupon, busyCard, v$, quantity, checkout, hideErrors} = storeToRefs(store)
const handleToogleCoupon = () => {
  store.toggleCoupon();
}
const handleToogleCard = () => {
  store.toggleCard();
}
const handleApplyCard = async () => {
  await store.applyCard()
}
const handleApplyCoupon = async () => {
  await store.applyCoupon();
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
