<template>
  <div class="d-flex flex-column bg-white">
    <div class="row g-0 flex-fill">
      <div class="col-12 col-lg-6 col-xl-4 border-top-wide border-primary d-flex flex-column justify-content-center">
        <div class="container container-tight my-5 px-lg-5">
          <div class="text-center mb-4">
            <a href="/" aria-label="BIT" class="navbar-brand navbar-brand-autodark">
              <img src="/TreeSix_Horizontal_Cor.png" alt="BIT Logo" height="20" width="200">
            </a>
          </div>
          <h2 class="h3 text-center mb-3">Recuperar conta</h2>
          <BitAlert :type="errorType" v-model="errorMessage" />
          <!-- Step 0: Telefone -->
          <form v-if="steps === 0" @submit.prevent="submitPhone">
            <div class="mb-3">
              <label class="form-label">Telefone</label>
              <input
                type="text"
                v-model="credentials.phone"
                class="form-control"
                placeholder="Telefone"
                autocomplete="off"
                required
              >
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
              {{ loading ? "Verificando..." : "Enviar" }}
            </button>
          </form>

          <!-- Step 1: Código -->
          <form v-else-if="steps === 1" @submit.prevent="submitCode">
            <div class="mb-3">
              <label class="form-label">Código de verificação</label>
              <input
                type="text"
                v-model="credentials.code"
                class="form-control text-center"
                maxlength="8"
                placeholder="Digite os 8 dígitos"
                required
              >
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
              {{ loading ? "Validando..." : "Verificar código" }}
            </button>
          </form>

          <!-- Step 2: Nova palavra-passe -->
          <form v-else-if="steps === 2" @submit.prevent="submitNewPassword">
            <div class="mb-3">
              <label class="form-label">Nova palavra-passe</label>
              <input
                type="password"
                v-model="credentials.password"
                class="form-control"
                placeholder="Nova palavra-passe"
                required
              >
            </div>
            <div class="mb-3">
              <label class="form-label">Repetir palavra-passe</label>
              <input
                type="password"
                v-model="credentials.passwordConfirmation"
                class="form-control"
                placeholder="Repetir palavra-passe"
                required
              >
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="loading">
              {{ loading ? "A guardar..." : "Atualizar palavra-passe" }}
            </button>
          </form>

          <!-- Step 3: Finalizado -->
          <div v-else class="text-center">
            <i class="ti ti-check-circle text-success" style="font-size: 48px;"></i>
            <h5 class="mt-3">Palavra-passe redefinida com sucesso!</h5>
            <p class="text-muted">Agora já pode entrar com a nova palavra-passe.</p>
            <router-link class="btn btn-primary" to="/central/login">Ir para login </router-link>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-6 col-xl-8 d-none d-lg-block">
        <div
          class="bg-cover h-100 min-vh-100"
          style="background-image: url(/background2.jpg); background-position: center 40%; background-repeat: no-repeat; background-size: cover;">
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue"
import BitAlert from "@components/BitAlert.vue"
import authService from "@central/common/domain/services/authService"
const loading = ref(false)
const steps = ref(0)
const errorMessage = ref<string>("")
const errorType = ref<string>("danger")
const credentials = ref({
  phone: "",
  code: "",
  password: "",
  passwordConfirmation: "",
  token: ""
})
const submitPhone = async () => {
  loading.value = true
  errorMessage.value = ""
  try {
    await authService.checkPhone(credentials.value.phone)
    steps.value = 1
    errorMessage.value = "Código enviado para o telefone"
    errorType.value = "success"
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || "Erro ao verificar telefone"
    errorType.value = err.response?.data?.type || "danger"
  } finally {
    loading.value = false
  }
}
const submitCode = async () => {
  loading.value = true
  errorMessage.value = ""
  try {
    const res = await authService.verifyCode(credentials.value.phone, credentials.value.code)
    credentials.value.token = res.data.token
    steps.value = 2
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || "Erro ao validar código"
    errorType.value = err.response?.data?.type || "danger"
  } finally {
    loading.value = false
  }
}
const submitNewPassword = async () => {
  if (credentials.value.password !== credentials.value.passwordConfirmation) {
    errorMessage.value = "As palavras-passe não coincidem"
    return
  }
  loading.value = true
  errorMessage.value = ""
  try {
    await authService.resetPassword(credentials.value.phone, credentials.value.password)
    steps.value = 3
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || "Erro ao redefinir a palavra-passe"
    errorType.value = err.response?.data?.type || "danger"
  } finally {
    loading.value = false
  }
}
</script>
