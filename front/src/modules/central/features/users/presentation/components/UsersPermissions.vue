<!--
 - Copyright © 2021 - 2025
 - Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="p-3">
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border spinner-border-sm" role="status"></div>
    </div>

    <template v-else-if="permissions">

      <!-- Perfis atribuídos -->
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Perfis</h5>
          <button class="btn btn-sm btn-outline-primary" @click="showAddProfile = !showAddProfile">
            <IconPlus size="14" class="me-1" />Adicionar
          </button>
        </div>

        <!-- Picker de perfis -->
        <div v-if="showAddProfile" class="mb-3 p-2 rounded border">
          <label class="form-label small">Selecionar perfil</label>
          <select class="form-select form-select-sm" v-model="selectedProfileId">
            <option value="">Escolher...</option>
            <option
              v-for="p in availableProfiles"
              :key="p.id"
              :value="p.id"
            >{{ p.name }}</option>
          </select>
          <button class="btn btn-sm btn-primary mt-2" @click="assignProfile" :disabled="!selectedProfileId || assigning">
            <span v-if="assigning" class="spinner-border spinner-border-sm me-1"></span>
            Atribuir
          </button>
        </div>

        <div v-if="permissions.profiles.length === 0" class="text-muted small">Nenhum perfil atribuído</div>
        <div v-for="profile in permissions.profiles" :key="profile.id" class="card card-sm mb-2">
          <div class="card-body py-2 px-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="fw-semibold">{{ profile.name }}</span>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <span v-if="profile.rules?.includes('*')" class="badge bg-red-lt text-red">Acesso Total</span>
                  <span v-else v-for="r in profile.rules" :key="r" class="badge bg-blue-lt text-blue small">{{ r }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-ghost-danger" @click="removeProfile(profile.id)" title="Remover perfil">
                <IconX size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Regras individuais -->
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="mb-0">Regras Individuais</h5>
          <button class="btn btn-sm btn-outline-secondary" @click="showRulesPicker = !showRulesPicker">
            <IconPencil size="14" class="me-1" />Editar
          </button>
        </div>

        <div v-if="showRulesPicker" class="mb-3 p-2 rounded border">
          <div class="row g-1">
            <div v-for="rule in ALL_RULES" :key="rule.value" class="col-6">
              <label class="form-check form-check-sm">
                <input class="form-check-input" type="checkbox" :value="rule.value" v-model="editIndividualRules" />
                <span class="form-check-label small">{{ rule.label }}</span>
              </label>
            </div>
          </div>
          <button class="btn btn-sm btn-primary mt-2" @click="saveIndividualRules" :disabled="savingRules">
            <span v-if="savingRules" class="spinner-border spinner-border-sm me-1"></span>
            Guardar
          </button>
        </div>

        <div v-if="permissions.individual_rules.length === 0 && !showRulesPicker" class="text-muted small">
          Nenhuma regra individual
        </div>
        <div class="d-flex flex-wrap gap-1">
          <span v-for="rule in permissions.individual_rules" :key="rule" class="badge bg-purple-lt text-purple">
            {{ rule }}
          </span>
        </div>
      </div>

      <!-- Regras efetivas (calculadas) -->
      <div>
        <h5 class="mb-2">Regras Efetivas</h5>
        <div class="d-flex flex-wrap gap-1">
          <span v-if="permissions.effective_rules.includes('*')" class="badge bg-red text-white">
            <IconStar size="10" class="me-1" />Acesso Total
          </span>
          <template v-else>
            <span
              v-for="rule in permissions.effective_rules"
              :key="rule"
              class="badge bg-green-lt text-green"
            >{{ rule }}</span>
            <span v-if="permissions.effective_rules.length === 0" class="text-muted small">Sem permissões activas</span>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { IconPlus, IconX, IconPencil, IconStar } from '@tabler/icons-vue'
import { ProfilesService } from '../../../profiles/domain/service/ProfilesService'

const ALL_RULES = [
  { label: 'Dashboard',       value: 'dashboard' },
  { label: 'Pedidos',         value: 'orders' },
  { label: 'Pagamentos',      value: 'payments' },
  { label: 'Cursos',          value: 'courses' },
  { label: 'Cupons',          value: 'coupons' },
  { label: 'Utilizadores',    value: 'users' },
  { label: 'Relatórios',      value: 'reports' },
  { label: 'Influenciadores', value: 'influencers' },
  { label: 'Configurações',   value: 'configs' },
  { label: 'Suporte',         value: 'helpers' },
  { label: 'Acesso Total (*)',value: '*' },
]

const props = defineProps<{ userId: number | null }>()

const loading = ref(false)
const permissions = ref<any>(null)
const allProfiles = ref<any[]>([])

const showAddProfile = ref(false)
const selectedProfileId = ref<number | ''>('')
const assigning = ref(false)

const showRulesPicker = ref(false)
const editIndividualRules = ref<string[]>([])
const savingRules = ref(false)

const availableProfiles = computed(() =>
  allProfiles.value.filter(p => !permissions.value?.profiles?.some((up: any) => up.id === p.id))
)

async function load() {
  if (!props.userId) return
  loading.value = true
  try {
    const [permRes, profRes] = await Promise.all([
      ProfilesService.getUserPermissions(props.userId),
      ProfilesService.index({ perPage: 100, page: 1 }),
    ])
    permissions.value = permRes.data
    allProfiles.value = profRes.data?.data || []
    editIndividualRules.value = [...(permRes.data?.individual_rules || [])]
  } finally {
    loading.value = false
  }
}

async function assignProfile() {
  if (!props.userId || !selectedProfileId.value) return
  assigning.value = true
  try {
    await ProfilesService.assignToUser(props.userId, Number(selectedProfileId.value))
    selectedProfileId.value = ''
    showAddProfile.value = false
    await load()
  } catch {
    alert('Erro ao atribuir perfil')
  } finally {
    assigning.value = false
  }
}

async function removeProfile(profileId: number) {
  if (!props.userId || !confirm('Remover este perfil do utilizador?')) return
  try {
    await ProfilesService.removeFromUser(props.userId, profileId)
    await load()
  } catch {
    alert('Erro ao remover perfil')
  }
}

async function saveIndividualRules() {
  if (!props.userId) return
  savingRules.value = true
  try {
    await ProfilesService.setUserRules(props.userId, editIndividualRules.value)
    showRulesPicker.value = false
    await load()
  } catch {
    alert('Erro ao guardar regras')
  } finally {
    savingRules.value = false
  }
}

watch(() => props.userId, () => { if (props.userId) load() })
onMounted(() => { if (props.userId) load() })
</script>
