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

<template>
  <div class="d-flex">
    <b-button variant="btn2" sm v-if="showView" href="#" @click.prevent="$emit('view', id)" class="me-2" title="Ver">
     <IconEye size="15" />
    </b-button>
    <b-button variant="btn2" v-if="showEdit" href="#" @click.prevent="$emit('edit', id)" class="me-2" title="Editar">
      <IconEdit size="15" />
    </b-button>
    <b-button variant="btn2" v-if="showDelete" href="#" @click.prevent="$emit('delete', id)" class="me-2"
      title="Eliminar">
       <IconTrash size="15" />
    </b-button>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-vue';
defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  showView: {
    type: Boolean,
    default: true
  },
  showEdit: {
    type: Boolean,
    default: true
  },
  showDelete: {
    type: Boolean,
    default: true
  }
});


defineEmits(['view', 'edit', 'delete']);
</script>
