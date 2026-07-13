<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este software é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda.
  -  Qualquer cópia, distribuição, modificação ou uso não autorizado deste software, no todo ou em parte,
  -  é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
-->

<template>
  <div class="d-flex flex-column min-vh-100 justify-content-center align-items-center bg-light">
    <div class="container-sm" style="max-width: 600px;">
      <div class="alert alert-warning d-flex align-items-start mb-4" role="alert">
        <i class="ti ti-shield-lock text-warning me-3" style="font-size: 26px;"></i>
        <div>
          <h2 class="alert-title mb-1 text-center mb-3 mt-3">Proteja a sua conta</h2>
          <p class="mb-2">
            Está a usar uma <strong>senha padrão</strong>. Altere-a agora por segurança.
          </p>
          <p class="mb-2">
            Confirme que está no site oficial:
            <strong class="text-primary">https://checkout.academiatreesix.com</strong>
          </p>
          <p class="mb-0">
            Nos <strong>nunca solicitamos senhas</strong> por e-mail, SMS ou WhatsApp.
          </p>
        </div>
      </div>
      <div class="card shadow-sm border-0 w-100">
        <div class="card-body">
          <h3 class="card-title mb-4 text-center">Alterar Palavra-passe</h3>

          <div class="row g-3 mb-3">
            <div class="col-12">
              <FormField v-model="passwordForm.newPassword" placeholder="Nova senha" type="password" />
            </div>
            <div class="col-12">
              <FormField v-model="passwordForm.confirmPassword" placeholder="Confirmar nova senha" type="password" />
            </div>
          </div>

          <div class="d-flex justify-content-center">
            <button class="btn btn-primary w-100" :disabled="loadingPassword" @click="updatePassword">
              <span v-if="loadingPassword"><i class="ti ti-loader ti-spin me-2"></i> A atualizar...</span>
              <span v-else>Guardar nova senha</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

</template>

<script setup lang="ts">
import { ref } from "vue"
import notification from "@common/application/utils/notification"
import userService from "@/modules/central/common/domain/services/userService"
import {useAuthStore} from "@common/presentation/stores/auth_store.ts";
import { useRouter } from 'vue-router'
const router = useRouter()
const passwordForm = ref({
  oldPassword: "treesix",
  newPassword: "",
  confirmPassword: "",
})

const loadingPassword = ref(false)

const updatePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    notification.error("Preencha todos os campos obrigatórios.")
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    notification.error("As palavras-passe não coincidem.")
    return
  }
  loadingPassword.value = true
  try {
    await userService.updatePassword(passwordForm.value)
    notification.success("Palavra-passe atualizada com sucesso.")
    router.push("/central/dashboard")
  } catch (err: any) {
    notification.error(err.message || "Erro ao atualizar a palavra-passe.")
  } finally {
    loadingPassword.value = false
  }
}
</script>

<style scoped>
.alert-warning {
  background: #fff8e1;
  border: 1px solid #ffe58f;
}
</style>
