<template>
  <div class="w-100 mb-2">
    <div class="progress" style="height: 10px; border-radius: 5px;">
      <div
        class="progress-bar"
        role="progressbar"
        :style="{
          width: progress + '%',
          backgroundColor: barColor,
          transition: 'width 1s linear, background-color 0.5s ease',
        }"
        :aria-valuenow="countdown"
        :aria-valuemin="0"
        :aria-valuemax="countime"
      ></div>
    </div>
    <div class="text-center mt-1 small fw-semibold" :style="{ color: barColor }">
      {{ countdown }}s restantes
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  countdown: number
  countime: number
}>()

const progress = computed(() => (props.countdown / props.countime) * 100)

const barColor = computed(() => {
  const percent = props.countdown / props.countime
  if (percent > 0.66) return '#28a745'
  if (percent > 0.33) return '#ffc107'
  return '#dc3545'
})
</script>
