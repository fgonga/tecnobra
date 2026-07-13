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
  <BModal :no-footer="hideFooter" :centered="centered" :no-header="hideHeader" :size="size" class="zIndexed p-0" ref="modal" :title="title" body-class="zIndexed p-0">
    <ModalLoading :busy="busy">
      <div class="p-4">
        <form @submit.prevent="handleSubmit">
          <MessageAlert :error="errors || ''" :dismissible="true" />
          <slot></slot>
        </form>
      </div>
    </ModalLoading>
    <template #footer>
      <slot name="footer" >
        <!-- fallback se o slot não for usado -->
        <div class="d-flex w-100" :class="createMore ? 'justify-content-between' : 'justify-content-end'">
          <div v-if="createMore">
            <div class="form-check px-0 d-flex" role="button">
              <input
                class="form-check-input me-2"
                type="checkbox"
                id="toggleContinuar"
                :checked="closeAfterSubmit"
                @change="closeAfterSubmit = !closeAfterSubmit"
              />
              <label class="form-check-label" for="toggleContinuar">
                Continuar
              </label>
            </div>
          </div>
          <BButton :disabled="busy" @click="handleSubmit" :variant="submitVariant">
            <i :class="submitIcon" v-if="submitIcon"></i> &nbsp; {{ submitText }}
          </BButton>
        </div>
      </slot>
    </template>
  </BModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BModal } from 'bootstrap-vue-next';
import Loading from "@components/loading.vue";

const props = defineProps({
  errors: {
    required: false
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'lg'
  },
  cancelText: {
    type: String,
    default: 'Fechar'
  },
  submitText: {
    type: String,
    default: 'Guardar'
  },
  submitIcon: {
    type: String,
    default: 'ti ti-device-floppy'
  },
  submitVariant: {
    type: String,
    default: 'primary'
  },
  busy: {
    type: Boolean,
    default: false
  },
  createMore: {
    type: Boolean,
    default: false
  },
  hideFooter: {
    type: Boolean,
    default: false
  },
  hideHeader: {
    type: Boolean,
    default: false
  },
  centered: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel', 'hidden', 'show']);
const modal = ref<InstanceType<typeof BModal> | null>(null);
const closeAfterSubmit = ref(false)
const show = () => {
  modal.value?.show();
  emit('show');
};
const hide = () => {

  //modal.value?.hide();
  emit('cancel');
};
const canHide = () => {

  if (!closeAfterSubmit.value) {
    modal.value?.hide();
    emit('cancel');
  }
};
const handleSubmit = () => {
  emit('submit', closeAfterSubmit.value);
};
// Expor métodos para uso externo
defineExpose({
  show,
  hide,
  canHide,
  closeAfterSubmit
});
</script>
<style>
.zIndexed {
  z-index: 10100 !important;
}
</style>
