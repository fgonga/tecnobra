<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="row g-2 align-items-center mb-3">
        <div class="col">
          <div class="page-pretitle">Conta</div>
          <h2 class="page-title">Meu Perfil</h2>
        </div>
      </div>

      <div class="card">
        <div class="row g-0">
          <!-- Sidebar -->
          <div class="col-12 col-md-3 border-end">
            <div class="card-body text-center py-4">
              <!-- Avatar with initials -->
              <span class="avatar avatar-xl mb-3 rounded" :style="avatarStyle">
                {{ initials }}
              </span>
              <div class="fw-bold">{{ authStore.user?.name }}</div>
              <div class="text-muted small">{{ authStore.user?.username }}</div>
              <div class="mt-1">
                <span class="badge bg-blue-lt text-blue">{{ userRoles.find(r => r.value === authStore.user?.role)?.label || '-' }}</span>
              </div>
            </div>
            <div class="list-group list-group-transparent mx-3 mb-3">
              <a href="#" class="list-group-item list-group-item-action d-flex align-items-center" :class="{ active: tab === 'info' }" @click.prevent="tab = 'info'">
                <IconUser size="16" class="me-2" /> Informações Gerais
              </a>
              <a href="#" class="list-group-item list-group-item-action d-flex align-items-center" :class="{ active: tab === 'security' }" @click.prevent="tab = 'security'">
                <IconLock size="16" class="me-2" /> Segurança
              </a>
            </div>
          </div>

          <!-- Content -->
          <div class="col-12 col-md-9 d-flex flex-column">
            <div class="card-body">

              <!-- Tab: Informações Gerais -->
              <div v-if="tab === 'info'">
                <h3 class="card-title">Informações Gerais</h3>
                <hr class="mt-0 mb-4" />
                <div v-if="infoLoading" class="text-center py-4"><div class="spinner-border"></div></div>
                <div v-else class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Nome</label>
                    <input class="form-control" type="text" v-model="userForm.name" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Username</label>
                    <input class="form-control" type="text" v-model="userForm.username" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Telefone</label>
                    <input class="form-control" type="text" v-model="userForm.phone" placeholder="Ex: 9XXXXXXXX" />
                  </div>
                  <div class="col-12 mt-3">
                    <button class="btn btn-primary" :disabled="loadingUser" @click="saveInfo">
                      <span v-if="loadingUser" class="spinner-border spinner-border-sm me-1"></span>
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              <!-- Tab: Segurança -->
              <div v-if="tab === 'security'">
                <h3 class="card-title">Alterar Palavra-passe</h3>
                <hr class="mt-0 mb-4" />
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Palavra-passe actual</label>
                    <input class="form-control" type="password" v-model="passwordForm.oldPassword" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Nova palavra-passe</label>
                    <input class="form-control" type="password" v-model="passwordForm.newPassword" />
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Confirmar nova</label>
                    <input class="form-control" type="password" v-model="passwordForm.confirmPassword" />
                  </div>
                  <div class="col-12">
                    <button class="btn btn-primary" :disabled="loadingPassword" @click="updatePassword">
                      <span v-if="loadingPassword" class="spinner-border spinner-border-sm me-1"></span>
                      Alterar Palavra-passe
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { IconUser, IconLock } from '@tabler/icons-vue'
import { useAuthStore } from '@common/presentation/stores/auth_store'
import userService from '@/modules/central/common/domain/services/userService'
import notification from '@common/application/utils/notification'
import { userRoles } from '@/modules/central/features/users/domain/constants/roles'

const authStore = useAuthStore()
const tab = ref<'info' | 'security'>('info')
const infoLoading = ref(false)
const loadingUser = ref(false)
const loadingPassword = ref(false)

const userForm = ref({ name: authStore.user?.name || '', username: authStore.user?.username || '', phone: authStore.user?.phone || '' })
const passwordForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const initials = computed(() => {
  const name = authStore.user?.name || authStore.user?.username || '?'
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
})

const COLORS = ['#4429f2', '#28a745', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997']
const avatarStyle = computed(() => {
  const idx = (authStore.user?.id || 0) % COLORS.length
  return { background: COLORS[idx], color: '#fff', fontSize: '1.5rem', fontWeight: '600' }
})

async function loadMe() {
  infoLoading.value = true
  try {
    const res = await userService.me()
    const u = res.data
    userForm.value = { name: u.name || '', username: u.username || '', phone: u.phone || '' }
  } catch { /* use store values */ } finally {
    infoLoading.value = false
  }
}

async function saveInfo() {
  loadingUser.value = true
  try {
    await userService.updateUser({ name: userForm.value.name, username: userForm.value.username })
    await userService.updatePhone(userForm.value.phone)
    authStore.setUser({ ...authStore.user, name: userForm.value.name, username: userForm.value.username, phone: userForm.value.phone })
    notification.success('Perfil atualizado')
  } catch { notification.error('Erro ao atualizar perfil') } finally {
    loadingUser.value = false
  }
}

async function updatePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    notification.error('As palavras-passe não coincidem')
    return
  }
  loadingPassword.value = true
  try {
    await userService.updatePassword(passwordForm.value)
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    notification.success('Palavra-passe alterada')
  } catch { notification.error('Erro ao alterar palavra-passe') } finally {
    loadingPassword.value = false
  }
}

onMounted(loadMe)
</script>
