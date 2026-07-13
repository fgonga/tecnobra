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

import { defineStore } from 'pinia'

interface SidebarState {
  openSidebars: string[]
}

export const useSidebarStore = defineStore('sidebar', {
  state: (): SidebarState => ({
    openSidebars: [],
  }),

  actions: {
    registerSidebar(id: string) {
      // Only add if not already in the list
      if (!this.openSidebars.includes(id)) {
        this.openSidebars.push(id)
      }
    },

    unregisterSidebar(id: string) {
      const index = this.openSidebars.indexOf(id)
      if (index !== -1) {
        this.openSidebars.splice(index, 1)
      }

      this.fixBackdrops()
    },

    fixBackdrops() {
      setTimeout(() => {
        const backdrops = document.querySelectorAll('.offcanvas-backdrop')
        const sidebars = document.querySelectorAll('.offcanvas.show')

        if (backdrops.length > sidebars.length) {
          backdrops.forEach((backdrop, index) => {
            if (index >= sidebars.length) {
              backdrop.remove()
            }
          })
        }

        sidebars.forEach((sidebar, index) => {
          const level = index + 1
          const zIndex = 1050 + level * 10

          ;(sidebar as HTMLElement).style.zIndex = zIndex.toString()

          if (backdrops[index]) {
            ;(backdrops[index] as HTMLElement).style.zIndex = (zIndex - 5).toString()
          }
        })
      }, 50)
    },
  },

  getters: {
    getSidebarLevel: (state) => (id: string) => {
      const index = state.openSidebars.indexOf(id)
      return index !== -1 ? index + 1 : 1
    },

    getOpenSidebarsCount: (state) => {
      return state.openSidebars.length
    },
  },
})
