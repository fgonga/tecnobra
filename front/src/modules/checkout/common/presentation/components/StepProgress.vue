<template>
  <div class="steps d-flex px-0 mx-0">
    <div
      v-for="(step, index) in props.steps"
      :key="index"
      class="step"
      @click="toStep(index)"
      :class="{ active: props.step === index , done: index  < props.step }"
    >
      <div class="circle"       role="button">{{ index + 1 }}</div>
      <span class="label"       role="button">{{ step }}</span>
      <div v-if="index < steps.length - 1" class="line"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineProps, defineEmits  } from 'vue'
const props = defineProps({
  steps: {
    type: Array,
    default: () => ['Personal Details', 'Payment', 'Complete'],
  },
  step: {
    type: Number,
    default: 0,
  },
})
const emit = defineEmits(['to'])
const toStep = (step:number) =>{
  emit('to',step)
}
</script>
<style lang="scss" scoped>
$primary: #4429f2;
$inactive: #e0e0e0;
$text-active: #000;
$text-inactive: #666;
.steps {
  display: flex;
  flex-wrap: wrap; /* permite quebrar linha no mobile */
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0;

  .step {
    display: flex;
    align-items: center;
    position: relative;

    .circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      background: $inactive;
      color: $text-inactive;
      transition: all 0.3s ease;
    }

    .label {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 500;
      color: $text-inactive;
      white-space: nowrap;
    }

    .line {
      width: 60px;
      height: 2px;
      background: $inactive;
      margin: 0 1rem;
      transition: background 0.3s ease;
    }

    &.active {
      .circle {
        background: $primary;
        color: white;
      }
      .label {
        color: $text-active;
      }
    }

    &.done {
      .circle {
        background: $primary;
        color: white;
        opacity: 0.8;
      }
      .line {
        background: $primary;
      }
    }
  }
}

/* MOBILE */
@media (max-width: 768px) {
  .steps {
    gap: 0.5rem;

    .step {
      .label {
        font-size: 12px;
        margin-left: 4px;
      }
      .line {
        width: 40px;
        margin: 0 0.5rem;
      }
    }
  }
}

</style>
