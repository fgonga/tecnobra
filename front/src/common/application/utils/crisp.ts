/*
 * Copyright © 2021 - 2025
 * Bantu Internet Technologies, Lda. Todos os direitos reservados.
 * Este ‘software’ é protegido por direitos autorais e é propriedade exclusiva da Bantu Internet Technologies, Lda. Qualquer cópia, distribuição, modificação ou uso não autorizado deste ‘software’, no todo ou em parte, é estritamente proibido e sujeito às penalidades legais aplicáveis.
 *  Bantu Internet Technologies, Lda.
 *  Rua 25 de Abril, Zona Comercial, Benguela, Angola
 *  geral@bit.ao
 *  www.bit.ao
 */

// Integração com o Crisp chat (carregado em index.html).
// window.$crisp é uma fila: os push funcionam mesmo antes do script carregar.

declare global {
  interface Window {
    $crisp?: unknown[]
    CRISP_TOKEN_ID?: string | null
  }
}

function crispPush(command: unknown[]) {
  if (!window.$crisp) return
  window.$crisp.push(command)
}

// Envia os dados do utilizador autenticado para o Crisp (nome, email, telefone, etc.)
// O CRISP_TOKEN_ID liga a sessão de chat à identidade do utilizador: o mesmo
// utilizador recupera a mesma conversa em qualquer browser, sem duplicar contactos.
export function syncCrispUser(user: Record<string, any> | null | undefined) {
  if (!user) return

  const token = user.id != null ? `user-${user.id}` : null
  if (token && window.CRISP_TOKEN_ID !== token) {
    window.CRISP_TOKEN_ID = token
    // O reset é obrigatório para o Crisp adotar o novo token em runtime
    crispPush(['do', 'session:reset'])
  }

  if (user.name) crispPush(['set', 'user:nickname', [user.name]])
  if (user.email) crispPush(['set', 'user:email', [user.email]])
  if (user.phone) crispPush(['set', 'user:phone', [String(user.phone)]])

  const sessionData: [string, string][] = []
  if (user.id != null) sessionData.push(['user_id', String(user.id)])
  if (user.username) sessionData.push(['username', String(user.username)])
  if (user.role) sessionData.push(['role', String(user.role)])
  if (sessionData.length) crispPush(['set', 'session:data', [sessionData]])
}

// Limpa a sessão do Crisp no logout para não vazar dados entre utilizadores.
export function resetCrispSession() {
  window.CRISP_TOKEN_ID = null
  crispPush(['do', 'session:reset'])
}

let crispHidden = false
let rehideRegistered = false

// Mostra/esconde o widget do chat. O Crisp volta a mostrar o botão quando chega
// uma mensagem do operador, por isso registamos um handler que o re-esconde.
export function setCrispVisibility(visible: boolean) {
  crispHidden = !visible
  crispPush(['do', visible ? 'chat:show' : 'chat:hide'])

  if (!rehideRegistered) {
    rehideRegistered = true
    crispPush([
      'on',
      'message:received',
      () => {
        if (crispHidden) crispPush(['do', 'chat:hide'])
      },
    ])
  }
}
