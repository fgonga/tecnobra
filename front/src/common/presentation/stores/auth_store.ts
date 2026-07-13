/*
 * Copyright © 2021 - 2025
 * Bantu Internet Technologies, Lda. Todos os direitos reservados.
 * Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *  Bantu Internet Technologies, Lda.
 *  Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *  geral@bit.ao
 *  www.bit.ao
 */
import { defineStore } from 'pinia'
interface AuthState {
  token: string | null
  user: Record<string, any> | null
}
export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
    rules: localStorage.getItem('rules') ? JSON.parse(localStorage.getItem('rules') as string[]) : [],
  }),
  getters: {
    isAuthenticated: (state): boolean => !!state.token,
  },
  actions: {
    setToken(token: string) {
      if (!token) return
      this.token = token
      localStorage.setItem('token', token)
    },
    setUser(user: Record<string, any>) {
      if (!user) return
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    setRules(rules: string[]) {
      if (!rules) return
      this.rules = rules
      localStorage.setItem('rules', JSON.stringify(rules))
    },
    clearAuth() {
      this.token = null
      this.user = null
      this.rules = []
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('rules')
    },
  },
})
