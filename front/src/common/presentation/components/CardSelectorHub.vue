<!--
 -   Copyright © 2021 - 2025
 -   Bantu Internet Technologies, Lda. Todos os direitos reservados.
-->
<template>
  <div class="page-body">
    <div class="container-xl mb-3">
      <div v-if="pretitle || title" class="page-header d-print-none mb-3">
        <div class="row align-items-center">
          <div class="col">
            <div v-if="pretitle" class="page-pretitle">{{ pretitle }}</div>
            <h2 v-if="title" class="page-title">{{ title }}</h2>
          </div>
        </div>
      </div>

      <div class="row row-cards mb-2">
        <div
          v-for="card in cards"
          :key="card.key"
          :class="cardColClass"
        >
          <button
            type="button"
            class="card hub-card w-100 h-100 text-start"
            :class="{ selected: selected === card.key, 'hub-card--dense': dense }"
            @click="select(card.key)"
          >
            <div class="card-body">
              <div class="d-flex align-items-center" :class="dense ? 'mb-1' : 'mb-2'">
                <span class="avatar avatar-sm rounded" :class="`bg-${card.color || 'primary'}-lt text-${card.color || 'primary'}`">
                  <component :is="card.icon" :size="dense ? 16 : 18" />
                </span>
                <div class="ms-2 fw-semibold" :class="{ small: dense }">{{ card.title }}</div>
              </div>
              <div class="text-muted small hub-card-desc">{{ card.description }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <component :is="selectedComponent" :key="selected" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface HubCard {
  key: string
  title: string
  description: string
  icon: any
  color?: string
  component: any
}

const props = withDefaults(
  defineProps<{
    cards: HubCard[]
    pretitle?: string
    title?: string
    cardColClass?: string
    defaultKey?: string
    dense?: boolean
  }>(),
  {
    cardColClass: 'col-sm-6 col-lg-4',
    dense: false,
  },
)

const selected = ref(props.defaultKey || props.cards[0]?.key)

const selectedComponent = computed(() => {
  const card = props.cards.find(c => c.key === selected.value)
  return card?.component ?? null
})

function select(key: string) {
  selected.value = key
}
</script>

<style scoped>
.hub-card {
  border: 1px solid var(--tblr-border-color, var(--bs-border-color));
  transition: border-color .15s, box-shadow .15s;
  cursor: pointer;
  background: var(--tblr-card-bg, var(--bs-card-bg));
}
.hub-card:hover {
  border-color: var(--tblr-primary, var(--bs-primary));
}
.hub-card.selected {
  border-color: var(--tblr-primary, var(--bs-primary));
}
.hub-card-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.hub-card--dense .card-body {
  padding: .5rem .75rem;
}
.hub-card--dense .hub-card-desc {
  -webkit-line-clamp: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
