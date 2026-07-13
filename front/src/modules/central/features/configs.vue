<!--
 -  Tecnobra — Configurações gerais (parametrização).
-->
<template>
  <div class="page-body">
    <div class="container-xl">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Configurações gerais</h3>
        </div>
        <div class="card-body">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" />
          </div>
          <form v-else @submit.prevent="save">
            <div class="row">
              <FormField
                v-model="form.nome_organizacao"
                label="Nome da organização"
                type="text"
                :required="true"
                columnClass="col-md-6"
              />
              <FormField
                v-model="form.alerta_ferramentas_hora"
                label="Hora do alerta de ferramentas não devolvidas"
                type="text"
                hint="Formato HH:MM (ex.: 18:30)"
                columnClass="col-md-6"
              />
              <FormField
                v-model="form.alertas_ativos"
                label="Alertas inteligentes ativos"
                type="checkbox"
                columnClass="col-md-6"
              />
              <FormField
                v-model="form.stock_alerta_ativo"
                label="Alerta de stock baixo ativo"
                type="checkbox"
                columnClass="col-md-6"
              />
            </div>
            <div class="mt-3">
              <button class="btn btn-primary" type="submit" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2" />
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { API } from "@common/domain/services/api";
import notify from "@common/application/utils/notification";

const loading = ref(true);
const saving = ref(false);

const form = reactive({
  nome_organizacao: "",
  alerta_ferramentas_hora: "18:30",
  alertas_ativos: true,
  stock_alerta_ativo: true,
});

onMounted(async () => {
  try {
    const { data } = await API.get<any>("/api/v1/config");
    form.nome_organizacao = data.nome_organizacao ?? "";
    form.alerta_ferramentas_hora = data.alerta_ferramentas_hora ?? "18:30";
    form.alertas_ativos = !!data.alertas_ativos;
    form.stock_alerta_ativo = !!data.stock_alerta_ativo;
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  try {
    await API.post("/api/v1/config", {
      nome_organizacao: form.nome_organizacao,
      alerta_ferramentas_hora: form.alerta_ferramentas_hora,
      alertas_ativos: form.alertas_ativos ? 1 : 0,
      stock_alerta_ativo: form.stock_alerta_ativo ? 1 : 0,
    });
    notify.success("Configurações guardadas.");
  } finally {
    saving.value = false;
  }
}
</script>
