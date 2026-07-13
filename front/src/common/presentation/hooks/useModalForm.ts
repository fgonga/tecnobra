/*
 *  Copyright © 2021 - 2025
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *
 *   Bantu Internet Technologies, Lda.
 *   Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *   geral@bit.ao
 *   www.bit.ao
 *
 *
 */

import { ref, reactive, computed, watch, getCurrentInstance } from 'vue'
import { BModal } from 'bootstrap-vue-next'
import Form from 'vform'
import useVuelidate from '@vuelidate/core'
import type { Reactive, Ref } from 'vue'

export interface UseModalFormOptions<T> {
  defaultValues: T
  rules: (
    form?: Reactive<
      T & {
      errors: any
    }
      >,
  ) => Record<string, any>
  handler?: (form: any) => Promise<void> | void
  beforeSend?: (data: Reactive<T>) => T
  editMode?: boolean
  createMore?: boolean
  defaultsRef?: Ref<Partial<T>> | (() => Partial<T>)
}

export function useModalForm<T extends Record<string, any>>({
                                                              beforeSend = (data) => data.value || data,
                                                              ...options
                                                            }: UseModalFormOptions<T>) {
  const {
    defaultValues,
    rules,
    handler,
    editMode = false,
    defaultsRef,
    createMore = true,
  } = options

  // Criar um ID único para esta instância para evitar conflitos
  const instance = getCurrentInstance()
  const instanceId = `modal-form-${instance?.uid || Math.random().toString(36).substr(2, 9)}`

  const modal = ref<InstanceType<typeof BModal> | null>(null)
  const busy = ref(false)

  const initialDefaults =
    typeof defaultsRef === 'function' ? defaultsRef() : defaultsRef?.value || {}

  // Criar form isolado para esta instância
  const form = reactive({
    // ...structuredClone(defaultValues),
    ...defaultValues,
    ...initialDefaults,
    errors: new Form({}).errors,
  })

  const validationRules = computed(() => {
    return rules(form)
  })

  // Usar escopo único para evitar conflitos entre instâncias
  const v$ = useVuelidate(validationRules, form, {
    $scope: instanceId,
    $stopPropagation: true,
  })

  if (defaultsRef) {
    if (typeof defaultsRef === 'function') {
      watch(
        defaultsRef,
        (newDefaults) => {
          Object.assign(form, {
            ...form,
            ...newDefaults,
          })
        },
        { deep: true },
      )
    } else {
      watch(
        defaultsRef,
        (newDefaults) => {
          Object.assign(form, {
            ...form,
            ...newDefaults,
          })
        },
        { deep: true },
      )
    }
  }

  function show() {
    // Resetar validações ao abrir
    v$.value.$reset()
    modal.value?.show()
  }

  function hide() {
    modal.value?.canHide()
  }

  function resetForm() {
    const currentDefaults =
      typeof defaultsRef === 'function' ? defaultsRef() : defaultsRef?.value || {}

    Object.assign(form, {
      ...structuredClone(defaultValues),
      ...currentDefaults,
    })
    form.errors.clear()
    v$.value.$reset()
  }

  function closable() {
    console.log(`[${instanceId}] closableModalForm`)
  }

  async function handleSubmit(event) {
    console.log(`[${instanceId}] Enviar form`)
    v$.value.$touch()
    if (v$.value.$error) {
      console.error(`[${instanceId}] Validation errors:`, v$.value.$errors)
      return
    }

    busy.value = true
    form.errors.clear() // <-- Limpa os erros anteriores
    try {
      if (handler) {
        await handler(beforeSend(form))
      }
      resetForm()
    } catch (error: any) {
      console.log(`[${instanceId}] Error:`, error)
      if (error.response?.data?.errors) {
        form.errors.set(error.response.data.errors)
      }
    } finally {
      busy.value = false
    }
  }
  function setForm(data: Partial<T>) {
    Object.assign(form, data)
  }
  return {
    setForm,
    instanceId,
    modal,
    busy,
    form,
    v$,
    show,
    hide,
    resetForm,
    handleSubmit,
    createMore,
    closable,
  }
}
