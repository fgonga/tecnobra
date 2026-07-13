<template>
  <ModalForm
    :hideFooter="true"
    centered
    :hideHeader="true"
    ref="modal"
    :title="'Criar Pedido'"
    submitText="Guardar"
    submitIcon="ti ti-device-floppy"
  >
    <div class="d-flex justify-content-center align-items-center px-2 pt-3  flex-wrap">
      <p class="w-100 text-center text-primary">
        <b> Os pagamentos so podem ser feitos através do checkout.</b>
      </p>
    </div>
  </ModalForm>
</template>
<script setup lang="ts">
import { required } from "@common/application/utils/validators";
import ModalForm from "@components/ModalForm.vue";
import type { IOrders } from "@/modules/Orders/common/application/dtos";
import { useModalForm } from "@common/presentation/hooks/useModalForm";
import { IconReload } from "@tabler/icons-vue";
import { defineProps, ref } from "vue";
import { OrdersService } from "@central/features/orders/domain/service/OrdersService";
const defaultOrders: Partial<IOrders> = {};
const props = defineProps();
const { modal, busy, show, hide, resetForm, handleSubmit } =
  useModalForm<Partial<IOrders>>({
    defaultValues: defaultOrders,
    defaultsRef: () => props.defaults,
    editMode: props.editMode,
    handler: props.handler,
    rules: () => ({ name: { required } }),
  });
const isLoading = ref(false);
defineExpose({ show, hide, resetForm });
</script>

