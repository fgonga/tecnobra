<!--
 - Copyright © 2021 - 2025
 - Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl">

      <!-- Header -->
      <div class="row g-2 align-items-center mb-3">
        <div class="col">
          <div class="page-pretitle">Utilizadores</div>
          <h2 class="page-title">Perfis de Permissão</h2>
        </div>
        <div class="col-auto ms-auto d-print-none">
          <button class="btn btn-primary" @click="openCreate">
            <IconPlus size="16" class="me-1" /> Novo Perfil
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border" role="status"></div>
      </div>

      <!-- Profiles grid -->
      <div v-else class="row row-cards">
        <div v-if="profiles.length === 0" class="col-12 text-center text-muted py-5">
          Nenhum perfil encontrado
        </div>
        <div v-for="profile in profiles" :key="profile.id" class="col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h4 class="card-title mb-0">{{ profile.name }}</h4>
                  <p class="text-muted small mb-0">{{ profile.description || 'Sem descrição' }}</p>
                </div>
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-ghost-secondary" @click="openEdit(profile)" title="Editar">
                    <IconPencil size="14" />
                  </button>
                  <button class="btn btn-sm btn-ghost-danger" @click="deleteProfile(profile.id)" title="Eliminar">
                    <IconTrash size="14" />
                  </button>
                </div>
              </div>
              <!-- Rules badges -->
              <div class="mt-3">
                <div class="d-flex flex-wrap gap-1 mb-2">
                  <span v-if="profile.rules?.includes('*')" class="badge bg-red text-white">
                    <IconStar size="10" class="me-1" />Acesso Total
                  </span>
                  <template v-else>
                    <span v-for="rule in profile.rules" :key="rule" class="badge bg-blue-lt text-blue">{{ rule }}</span>
                    <span v-if="!profile.rules?.length" class="text-muted small">Sem regras</span>
                  </template>
                </div>
                <button class="btn btn-sm btn-outline-secondary w-100 mt-1" @click="openManageRules(profile)">
                  <IconShield size="14" class="me-1" /> Gerir Regras
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Create / Edit Modal ──────────────────────────────────────────────── -->
    <div v-if="showFormModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editTarget ? 'Editar Perfil' : 'Novo Perfil' }}</h5>
            <button type="button" class="btn-close" @click="showFormModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label required">Nome</label>
              <input class="form-control" type="text" v-model="form.name" placeholder="Ex: Operador de Vendas" />
            </div>
            <div class="mb-3">
              <label class="form-label">Descrição</label>
              <input class="form-control" type="text" v-model="form.description" placeholder="Breve descrição do perfil" />
            </div>
            <div v-if="!editTarget">
              <label class="form-label">Regras iniciais</label>
              <div class="row g-2">
                <div v-for="rule in ALL_RULES" :key="rule.value" class="col-6">
                  <label class="form-check">
                    <input class="form-check-input" type="checkbox" :value="rule.value" v-model="form.rules" />
                    <span class="form-check-label">{{ rule.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showFormModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="submitForm" :disabled="formLoading || !form.name">
              <span v-if="formLoading" class="spinner-border spinner-border-sm me-1"></span>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Manage Rules Modal ───────────────────────────────────────────────── -->
    <div v-if="showRulesModal" class="modal modal-blur show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Regras — {{ rulesTarget?.name }}</h5>
            <button type="button" class="btn-close" @click="showRulesModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="row g-2">
              <div v-for="rule in ALL_RULES" :key="rule.value" class="col-6">
                <label class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :value="rule.value"
                    v-model="editRules"
                    :disabled="rulesLoading"
                  />
                  <span class="form-check-label">{{ rule.label }}</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-default" @click="showRulesModal = false">Cancelar</button>
            <button class="btn btn-primary" @click="saveRules" :disabled="rulesLoading">
              <span v-if="rulesLoading" class="spinner-border spinner-border-sm me-1"></span>
              Guardar Regras
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { IconPlus, IconPencil, IconTrash, IconShield, IconStar } from '@tabler/icons-vue'
import { ProfilesService } from '../../domain/service/ProfilesService'

const ALL_RULES = [
  { label: 'Dashboard',      value: 'dashboard' },
  { label: 'Pedidos',        value: 'orders' },
  { label: 'Pagamentos',     value: 'payments' },
  { label: 'Cursos',         value: 'courses' },
  { label: 'Cupons',         value: 'coupons' },
  { label: 'Utilizadores',   value: 'users' },
  { label: 'Relatórios',     value: 'reports' },
  { label: 'Influenciadores',value: 'influencers' },
  { label: 'Configurações',  value: 'configs' },
  { label: 'Faturação',      value: 'invoices' },
  { label: 'Suporte',        value: 'helpers' },
  { label: 'Acesso Total (*)', value: '*' },
]

const profiles = ref<any[]>([])
const loading = ref(false)

// ── Form modal ──────────────────────────────────────────────────────────────
const showFormModal = ref(false)
const formLoading = ref(false)
const editTarget = ref<any>(null)
const form = reactive({ name: '', description: '', rules: [] as string[] })

// ── Rules modal ─────────────────────────────────────────────────────────────
const showRulesModal = ref(false)
const rulesLoading = ref(false)
const rulesTarget = ref<any>(null)
const editRules = ref<string[]>([])

async function loadProfiles() {
  loading.value = true
  try {
    const res = await ProfilesService.index({ perPage: 100, page: 1 })
    profiles.value = res.data?.data || []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editTarget.value = null
  form.name = ''
  form.description = ''
  form.rules = []
  showFormModal.value = true
}

function openEdit(profile: any) {
  editTarget.value = profile
  form.name = profile.name
  form.description = profile.description || ''
  form.rules = []
  showFormModal.value = true
}

async function submitForm() {
  formLoading.value = true
  try {
    if (editTarget.value) {
      await ProfilesService.update(editTarget.value.id, { name: form.name, description: form.description })
    } else {
      const res = await ProfilesService.store({ name: form.name, description: form.description })
      const newId = res.data?.id
      if (newId && form.rules.length) {
        await ProfilesService.setRules(newId, form.rules)
      }
    }
    showFormModal.value = false
    loadProfiles()
  } catch {
    alert('Erro ao guardar perfil')
  } finally {
    formLoading.value = false
  }
}

async function deleteProfile(id: number) {
  if (!confirm('Eliminar este perfil? Os utilizadores que só têm este perfil perderão essas permissões.')) return
  try {
    await ProfilesService.destroy(id)
    loadProfiles()
  } catch {
    alert('Erro ao eliminar perfil')
  }
}

function openManageRules(profile: any) {
  rulesTarget.value = profile
  editRules.value = [...(profile.rules || [])]
  showRulesModal.value = true
}

async function saveRules() {
  if (!rulesTarget.value) return
  rulesLoading.value = true
  try {
    await ProfilesService.setRules(rulesTarget.value.id, editRules.value)
    showRulesModal.value = false
    loadProfiles()
  } catch {
    alert('Erro ao guardar regras')
  } finally {
    rulesLoading.value = false
  }
}

onMounted(loadProfiles)
</script>
