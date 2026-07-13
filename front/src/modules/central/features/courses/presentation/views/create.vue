<template>
  <ModalForm
    :hideFooter="!editMode"
    centered
    :hideHeader="true"
    ref="modal"
    :title="editMode ? 'Editar curso' : 'Adicionar curso'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
    :busy="busy || isLoading"
    @submit="handleSubmit"
  >
    <div class="px-3 py-4">
      <template v-if="!editMode">
        <h3 class="text-center mb-3">Adicionar curso</h3>

        <FormField
          label="Slug do curso"
          name="sync_slug"
          v-model="syncSlug"
          placeholder="ex.: curso-de-ingles"
          columnClass="col-md-12"
          @keyup.enter="handleSyncOne"
        />

        <transition name="fade">
          <div
            v-if="message.text"
            class="alert mt-3 text-center"
            :class="message.type === 'success' ? 'alert-success' : 'alert-danger'"
          >
            {{ message.text }}
          </div>
        </transition>

        <div class="text-center mt-3">
          <b-button @click="handleSyncOne" variant="primary" :disabled="isLoading || !syncSlug.trim()">
            <IconReload v-if="!isLoading" size="20" class="me-2" />
            <span v-if="isLoading">A sincronizar...</span>
            <span v-else>Sincronizar</span>
          </b-button>
        </div>
      </template>

      <template v-else>
        <div class="row" style="max-height: 500px; overflow-y: scroll">
          <div class="col-md-12 mb-4">
            <h5 class="mb-1">Níveis do teste (recomendação)</h5>
            <p class="text-muted small mb-2">
              Em que níveis do teste de nível este curso deve ser recomendado.
              Deixa vazio para aparecer em <strong>todos</strong> os níveis.
            </p>
            <div class="d-flex flex-wrap gap-2">
              <label
                v-for="lv in CEFR_LEVELS"
                :key="lv"
                class="btn btn-sm mb-0"
                :class="isCefrSelected(lv) ? 'btn-primary' : 'btn-outline-primary'"
              >
                <input type="checkbox" class="d-none" :checked="isCefrSelected(lv)" @change="toggleCefr(lv)" />
                {{ lv }}
              </label>
            </div>
          </div>

          <FormField label="Nome" name="name" v-model="form.name" columnClass="col-md-12" />
          <FormField label="Preço (AOA)" name="price" v-model="form.price" type="number" min="0" columnClass="col-md-6" />
          <FormField label="Dias de validade" name="days_until_expiry" v-model="form.days_until_expiry" type="number" min="0" columnClass="col-md-6" />
          <FormField label="URL da imagem" name="course_card_image_url" v-model="form.course_card_image_url" placeholder="https://..." columnClass="col-md-12" />
          <FormField label="Descrição" name="description" v-model="form.description" type="textarea" columnClass="col-md-12" />

          <div class="col-md-12">
            <h5 class="mt-3 mb-2">Níveis</h5>

            <div v-for="(level, index) in form.levels" :key="index" class="border rounded p-3 mb-2 bg-light">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>Nível {{ index + 1 }}</strong>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="removeLevel(index)">Remover</button>
              </div>
              <FormField label="Título" :name="`level_title_${index}`" v-model="level.title" placeholder="Título do nível" />
              <FormField label="Descrição" :name="`level_description_${index}`" v-model="level.description" placeholder="Descrição do nível" type="textarea" />
            </div>

            <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addLevel">
              Adicionar nível
            </button>
          </div>
        </div>
      </template>
    </div>
  </ModalForm>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { required } from "@common/application/utils/validators";
import ModalForm from "@components/ModalForm.vue";
import FormField from "@components/FormField.vue";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import { IconReload } from "@tabler/icons-vue";
import { CoursesService } from "../../domain/service/CoursesService";
import {ICourse} from "../../application/dtos";

const props = defineProps<{ editMode?: boolean; defaults?: Partial<ICourse>; handler?: Function }>();
const emit = defineEmits<{ (e: 'saved'): void }>();

const defaultCourses: Partial<ICourse> = {
  thinkific_type: "course",
  price: 0,
  days_until_expiry: 0,
  levels: [],
  cefr_levels: [],
};

const CEFR_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"];

const { modal, busy, show, hide, resetForm, handleSubmit, form } =
  useModalForm<Partial<ICourse>>({
    defaultValues: defaultCourses,
    defaultsRef: () => props.defaults,
    editMode: props.editMode,
    handler: props.handler,
    rules: () => ({
    }),
    beforeSend(data) {
      return {
        id: data.id,
        name: data.name,
        price: data.price,
        days_until_expiry: data.days_until_expiry,
        course_card_image_url: data.course_card_image_url,
        description: data.description,
        levels: data.levels,
        cefr_levels: normalizeCefr(data.cefr_levels),
      }
    },
  });

const addLevel = () => {
  if (!form.levels) form.levels = []
  form.levels.push({ title: "", description: "" })
}
const removeLevel = (index: number) => form.levels.splice(index, 1);

// ── Níveis CEFR do teste (recomendação) ──────────────────────────
function normalizeCefr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === "string") {
    try { const a = JSON.parse(v); return Array.isArray(a) ? a : [] } catch { return [] }
  }
  return []
}
const isCefrSelected = (lv: string) => normalizeCefr(form.cefr_levels).includes(lv)
const toggleCefr = (lv: string) => {
  const cur = normalizeCefr(form.cefr_levels)
  form.cefr_levels = cur.includes(lv) ? cur.filter((x) => x !== lv) : [...cur, lv]
}

const isLoading = ref(false);
const syncSlug = ref("");
const message = ref<{ text: string | null; type: "success" | "error" | null }>({
  text: null,
  type: null,
});

const handleSyncOne = async () => {
  const slug = syncSlug.value.trim();
  if (!slug || isLoading.value) return;
  isLoading.value = true;
  message.value = { text: null, type: null };
  try {
    const { data } = await CoursesService.syncOne(slug);
    message.value = {
      text: data?.status === "created"
        ? `Curso "${data?.name || slug}" adicionado com sucesso!`
        : `Curso "${data?.name || slug}" atualizado com sucesso!`,
      type: "success",
    };
    syncSlug.value = "";
    emit("saved");
  } catch (err: any) {
    message.value = {
      text: err?.response?.data?.message || "Falha ao sincronizar o curso. Verifique o slug e tente novamente.",
      type: "error",
    };
  } finally {
    isLoading.value = false;
  }
};

defineExpose({ show, hide, resetForm });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
