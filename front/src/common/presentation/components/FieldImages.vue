<!--
  -  Copyright © 2021 - 2050
  -  Bantu Internet Technologies, Lda. Todos os direitos reservados.
  -
  -  Este 'software' é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste 'software', no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
  -
  -   Bantu Internet Technologies, Lda.
  -   Rua 25 de Abril, Zona Comercial, Benguela, Angola
  -   geral@bit.ao
  -   www.bit.ao
  -
  -
-->

<template>
  <div>
    <!-- Lightbox -->
    <vue-easy-lightbox
      escDisabled
      moveDisabled
      :visible="visible"
      :imgs="srcs"
      :index="index"
      @hide="handleHide"
      style="position: fixed; right: 0; width: 100%; height: 100vh; top: 0"
    />

    <!-- Galeria -->
    <template v-if="galery">
      <div class="row">
        <div
          class="col-md-3"
          v-for="(image, i) in normalizedImages"
          :key="i"
        >
          <img
            @click="show(i)"
            :src="getImage(image)"
            alt="..."
            class="img-thumbnail"
          />
        </div>
      </div>
    </template>

    <!-- Imagem única -->
    <template v-else>
      <img
        :width="rounded ? 30 : defaultWidth"
        :height="rounded ? 30 : 50"
        @click="show(0)"
        :src="first"
        :style="{ borderRadius: rounded ? '50%' : '0' }"
        class="img-thumbnail"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import VueEasyLightbox from 'vue-easy-lightbox'

const props = defineProps({
  images: {
    type: [Array, String],
    required: false,
    default: () => [],
  },
  galery: {
    type: Boolean,
    required: false,
    default: false,
  },
  rounded: {
    type: Boolean,
    required: false,
    default: false,
  },
  defaultWidth: {
    type: Number,
    default: 100,
    required: false,
  },
  cover: {
    type: [Object, String],
    required: false,
    default: () => null,
  },
  default: {
    type: String,
    required: false,
    default: () => 'https://placehold.co/600x400?font=roboto&text=Sem%20Imagem',
  },
})

const visible = ref(false)
const index = ref(0)

/* Normaliza sempre para array */
const normalizedImages = computed(() => {
  if (Array.isArray(props.images)) return props.images
  if (typeof props.images === 'string' && props.images.trim() !== '')
    return [props.images]
  return []
})

/* Função universal para extrair o link */
const getImage = (image) => {
  if (!image) return props.default

  // Se for string simples
  if (typeof image === 'string') return image

  // Se for objeto com url/file
  if (image.url?.endsWith('storage')) {
    return `${image.url}/${image.file}`
  }

  // fallback genérico
  return image.url || props.default
}

/* Primeira imagem a exibir */
const first = computed(() => {
  const cover = props.cover
  if (cover) return getImage(cover)
  if (normalizedImages.value.length > 0)
    return getImage(normalizedImages.value[0])
  return props.default
})

/* Conjunto de imagens para o lightbox */
const srcs = computed(() => {
  const links = normalizedImages.value.map((img) => getImage(img))
  if (first.value && !links.includes(first.value)) links.push(first.value)
  return links
})

/* Mostrar / ocultar lightbox */
const show = (i = 0) => {
  index.value = i
  visible.value = true
}
const handleHide = () => {
  visible.value = false
}
</script>

<style scoped>
.img-thumbnail {
  cursor: pointer;
}
</style>
