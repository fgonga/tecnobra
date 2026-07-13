<!--
  -   Copyright © 2021 - 2050
  -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -   Este software é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -   Qualquer cópia, distribuição, modificação ou uso não autorizado deste software, no todo ou em parte,
  -   é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
-->
<template>
  <div class="d-flex flex-column ">
    <div class="row g-0 flex-fill">
      <div class="col-12 col-lg-6 col-xl-4 border-top-wide border-primary d-flex flex-column justify-content-center">
        <div class="container container-tight my-5 px-lg-5">
          <div class="text-center mb-4">
            <a href="/" aria-label="BIT" class="navbar-brand navbar-brand-autodark">
              <img src="/TreeSix_Horizontal_Cor.png" alt="BIT Logo" height="20" width="200">
            </a>
          </div>
          <h2 class="h3 text-center mb-3">Acesse a sua conta</h2>
          <BitAlert type="danger"  v-model="errorMessage"/>
          <form @submit.prevent="login">
            <div class="mb-3">
              <label class="form-label">Identificação</label>
              <input
                tabindex="1"
                type="text"
                v-model="credentials.identification"
                class="form-control"
                placeholder="Identificação"
                autocomplete="off"
                required
              >
            </div>
            <div class="mb-2">
              <label class="form-label">
                Palavra-passe
                <span class="form-label-description">
                  <router-link to="/central/forgot">Esqueci a senha</router-link>
                </span>
              </label>
              <div class="input-group input-group-flat">
                <FormField   :tabindex="2"   type="password"
                             v-model="credentials.password"
                             placeholder="Sua senha"
                             autocomplete="off"
                             required/>
              </div>
            </div>
            <div class="form-footer">
              <button tabindex="3" type="submit" class="btn btn-primary w-100" :disabled="loading">
                <span v-if="loading">
                  <i class="ti ti-loader ti-spin me-2"></i> A entrar...
                </span>
                <span v-else>
                  Entrar
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <div class="col-12 col-lg-6 col-xl-8 d-none d-lg-block">
        <div class="bg-cover h-100 min-vh-100" style="background-image: url(/background.jpg)"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue"
import authService  from "@central/common/domain/services/authService"
import BitAlert from "@components/BitAlert.vue";
import {useAuthStore} from "@common/presentation/stores/auth_store.ts";
import { useRouter } from 'vue-router'
const router = useRouter()
const credentials = ref({
  identification: "",
  password: ""
})
const loading = ref(false)
const errorMessage = ref<string>("")
const login = async () => {
  let authStore = useAuthStore()
  loading.value = true
  errorMessage.value = ""
  authService.login(credentials.value)
    .then(async res => {

      errorMessage.value = ""
      await authStore.setToken(res.data.token)
      await authStore.setUser(res.data.user)
      await authStore.setRules(res.data.rules)
      if (credentials.value.password == "treesix"){
        router.push('/central/auth/reset')
      }else{
        router.push('/central/dashboard')
      }
    })
    .catch(err => {
      errorMessage.value = err.response?.data?.message || "Erro ao fazer login"
    }).finally(() => {
    loading.value = false
  })
}
</script>
