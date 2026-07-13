<template>
  <div
    class="skeleton"
    :style="{
      height,
      width,
      borderRadius
    }"
  />
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
const props = defineProps<{
  height?: string
  width?: string
  borderRadius?: string
}>()

const height = props.height || "16px"
const width = props.width || "100%"
const borderRadius = props.borderRadius || "0px"
</script>

<style scoped>

.skeleton {
  position: relative;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  min-height: 16px;
}

.skeleton::after {
  content: "";
  position: absolute;
  top: 0;
  left: -150px;
  height: 100%;
  width: 150px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0),        /* transparente total */ rgba(0, 0, 0, 0.03),     /* detalhe escuro */
    rgba(0, 0, 0, 0)         /* transparente de novo */
  );
  animation: shimmer 2.1s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(500%);
  }
}

</style>
