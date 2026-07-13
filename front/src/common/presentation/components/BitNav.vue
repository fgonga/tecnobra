<!--
  -  Copyright © 2021 - 2025
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
  -->

<script setup lang="ts">
import { computed } from "vue";
import { Icon } from "@iconify/vue";
import { useAuthStore } from "@common/presentation/stores/auth_store.ts";
const auth = useAuthStore();

// Converte "ti ti-home" → "tabler:home" para o Icon do @iconify/vue
const toIconify = (s: string) =>
  (s || "").replace(/^ti\s+ti-/, "tabler:").trim() || "tabler:circle";
const modules = [
  {
    navs: [
      {
        name: "Painel",
        icon: "ti ti-home",
        rules: [
          {
            name: "Painel",
            route: "dashboard",
            identification: "dashboard",
          },
        ],
      },
      {
        name: "Obras",
        icon: "ti ti-building",
        rules: [{ name: "Obras", route: "obras", identification: "obras" }],
      },
      {
        name: "Pessoal",
        icon: "ti ti-users",
        rules: [
          { name: "Trabalhadores", route: "trabalhadores", identification: "trabalhadores" },
          { name: "Empresas", route: "empresas", identification: "empresas" },
        ],
      },
      {
        name: "Portaria",
        icon: "ti ti-scan",
        rules: [
          { name: "Portaria (leitor QR)", route: "portaria", identification: "portaria" },
          { name: "Presenças", route: "presencas", identification: "portaria" },
        ],
      },
      // Fase 3: Equipamentos, Materiais
      // Fase 4: Visitantes, Veículos
      // Fase 5: Desempenho, Alertas, Relatórios
      {
        name: "Definições",
        icon: "ti ti-adjustments",
        rules: [
          {
            name: "Definições",
            route: "settings",
            identification: "configs",
          },
        ],
      },
      {
        name: "Administração",
        icon: "ti ti-settings",
        rules: [
          {
            name: "Administração",
            route: "admin",
            identification: "configs",
          },
        ],
      },
    ],
  },
];
// aplica filtro baseado nas regras guardadas
const allowedModules = computed(() => {
  const userRules = auth.rules || [];
  if (userRules.includes("*")) return modules;

  return modules.map((module) => ({
    ...module,
    navs: module.navs.filter((nav) => {
      // o menu só aparece se pelo menos uma das suas rules estiver autorizada
      return nav.rules.some((r) => userRules.includes(r.identification));
    }),
  }));
});
</script>

<template>
  <header class="navbar-expand-md">
    <div class="collapse navbar-collapse" id="navbar-menu">
      <div class="navbar">
        <div class="container-xl">
          <div class="row flex-fill align-items-center">
            <div class="col">
              <ul class="navbar-nav">
                <template v-for="module in allowedModules">
                  <template v-for="nav in module.navs">
                    <template v-if="nav.rules.length === 1">
                      <router-link
                        style="text-decoration: none"
                        active-class="active"
                        class="nav-item"
                        :to="{ name: nav.rules[0].route }"
                      >
                        <span class="nav-link">
                          <Icon :icon="toIconify(nav.icon)" :width="14" :height="14" class="me-2" />
                          <span class="nav-link-title">{{
                            nav.rules[0].name
                          }}</span>
                        </span>
                      </router-link>
                    </template>
                    <template v-else>
                      <li class="nav-item dropdown">
                        <a
                          class="nav-link dropdown-toggle"
                          href="#"
                          data-bs-toggle="dropdown"
                          data-bs-auto-close="outside"
                          role="button"
                          aria-expanded="false"
                        >
                          <Icon :icon="toIconify(nav.icon)" :width="14" :height="14" class="me-2" />
                          <span class="nav-link-title"> {{ nav.name }} </span>
                        </a>
                        <div class="dropdown-menu">
                          <RouterLink
                            v-for="rule in nav.rules"
                            class="dropdown-item d-flex align-items-center gap-2"
                            :to="{ name: rule.route }"
                          >
                            <Icon
                              v-if="rule.icon"
                              :icon="toIconify(rule.icon)"
                              :width="16"
                              :height="16"
                            />
                            {{ rule.name }}
                          </RouterLink>
                        </div>
                      </li>
                    </template>
                  </template>
                </template>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
