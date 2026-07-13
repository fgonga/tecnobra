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
  <div>
    <!-- INÍCIO CABEÇALHO -->
    <div class="page-header d-print-none" aria-label="Cabeçalho da página">
      <div class="container-xl">
        <div class="row g-2 align-items-center">
          <div class="col">
            <h2 class="page-title">Definições de Conta</h2>
          </div>
        </div>
      </div>
    </div>
    <!-- FIM CABEÇALHO -->

    <!-- INÍCIO CORPO -->
    <div class="page-body">
      <div class="container-xl">
        <div class="card">
          <div class="row g-0">
            <div class="col-12 col-md-3 border-end">
              <div class="card-body">
                <h4 class="subheader">Definições Gerais</h4>
                <div class="list-group list-group-transparent">
                  <a href="#" class="list-group-item list-group-item-action d-flex align-items-center active">
                    Minha Conta
                  </a>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-9 d-flex flex-column">
              <div class="card-body">
                <h2>Minha Conta</h2>
                <hr class="my-0 py-0 mb-5">

                <!-- Atualizar Nome e Username -->
                <div class="row g-3 mb-4">
                  <div class="col-md">
                    <label class="form-label">Nome</label>
                    <input type="text" v-model="userForm.name" class="form-control" />
                  </div>
                  <div class="col-md">
                    <label class="form-label">Username</label>
                    <input type="text" v-model="userForm.username" class="form-control" />
                  </div>
                  <div class="col-12 mt-2">
                    <button class="btn btn-1" :disabled="loadingUser" @click="updateUser">
                      <span v-if="loadingUser"><i class="ti ti-loader ti-spin me-2"></i> A atualizar...</span>
                      <span v-else>Alterar</span>
                    </button>
                  </div>
                </div>

                <!-- Atualizar Telefone -->
                <h3 class="card-title mt-4">Telefone</h3>
                <div class="row g-2 mb-4">
                  <div class="col-auto">
                    <input type="text" v-model="phoneForm.phone" class="form-control w-auto" />
                  </div>
                  <div class="col-auto">
                    <button class="btn btn-1" :disabled="loadingPhone" @click="updatePhone">
                      <span v-if="loadingPhone"><i class="ti ti-loader ti-spin me-2"></i> A atualizar...</span>
                      <span v-else>Alterar</span>
                    </button>
                  </div>
                </div>
                <h3 class="card-title mt-4">Palavra-passe</h3>
                <p class="card-subtitle">Este telefone será usado para aceder à sua conta ou alterar a sua palavra-passe caso esqueça.</p>
                <div class="row g-2 mb-4">
                  <div class="col-auto">
                    <FormField v-model="passwordForm.oldPassword" placeholder="Palavra-passe antiga" type="password" />
                  </div>
                  <div class="col-auto">
                    <FormField v-model="passwordForm.newPassword" placeholder="Nova palavra-passe" type="password" />
                  </div>
                  <div class="col-auto">
                    <FormField v-model="passwordForm.confirmPassword" placeholder="Repita a nova palavra-passe" type="password" />
                  </div>
                  <div class="col-auto">
                    <button class="btn btn-1" :disabled="loadingPassword" @click="updatePassword">
                      <span v-if="loadingPassword"><i class="ti ti-loader ti-spin me-2"></i> A atualizar...</span>
                      <span v-else>Alterar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="card-footer bg-transparent mt-auto">
                <div class="btn-list justify-content-end">
                  <a href="#" class="btn btn-1">Cancelar</a>
                  <button class="btn btn-primary btn-2" @click="saveAll">Guardar Tudo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- FIM CORPO -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useAuthStore } from "@common/presentation/stores/auth_store"
import userService from "@common/domain/services/userService"


const authStore = useAuthStore()

// Forms
const userForm = ref({ name: authStore.user?.name || "", username: authStore.user?.username || "" })
const phoneForm = ref({ phone: authStore.user?.phone || "" })
const passwordForm = ref({ oldPassword: "", newPassword: "", confirmPassword: "" })

// Loadings
const loadingUser = ref(false)
const loadingPhone = ref(false)
const loadingPassword = ref(false)

// Métodos
const updateUser = async () => {
  loadingUser.value = true
  try {
    await userService.updateUser(userForm.value)
  } finally {
    loadingUser.value = false
  }
}

const updatePhone = async () => {
  loadingPhone.value = true
  try {
    await userService.updatePhone(phoneForm.value)
  } finally {
    loadingPhone.value = false
  }
}

const updatePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert("As palavras-passe não coincidem")
    return
  }
  loadingPassword.value = true
  try {
    await userService.updatePassword(passwordForm.value)
  } finally {
    loadingPassword.value = false
  }
}

const saveAll = async () => {
  await Promise.all([updateUser(), updatePhone(), updatePassword()])
}
</script>

<style scoped>
</style>
