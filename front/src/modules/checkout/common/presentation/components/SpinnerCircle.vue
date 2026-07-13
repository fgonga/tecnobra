<template>
  <div class="w-100 mb-2 d-flex justify-content-center">
    <div class="loader"></div>
  </div>
</template>

<style scoped>
.loader {
  width: 115px;       /* aumenta o diâmetro */
  height: 115px;      /* idem */
  padding: 12px;      /* espessura do anel */
  border-radius: 50%;
  background: green;

  --_m:
    conic-gradient(#0000 30%, #eee),
    linear-gradient(#eee 0 0) content-box;

  -webkit-mask: var(--_m);
  mask: var(--_m);
  -webkit-mask-composite: source-out;
  mask-composite: subtract;

  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
