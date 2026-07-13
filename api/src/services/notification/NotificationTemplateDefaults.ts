/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Mensagens default por event_type × channel (SMS / WhatsApp).
 *
 *  IMPORTANTE: estes defaults são VERBATIM das mensagens que o sistema já
 *  envia hoje — não são texto inventado. Fontes:
 *    - PaymentReceived / EnrolmentCompleted (SMS) → worker-notification.ts
 *    - CartRecovery (SMS)                          → schedules/tasks/abandonedRemember.ts
 *    - CartRecovery (WhatsApp)                     → recover-payments.ts (buildMessage)
 *
 *  Os eventos sem mensagem fixa no sistema (OrderCreated, ReferenceGenerated,
 *  PaymentFailed — esta última é dinâmica via AppyPayWebHookMessage) NÃO são
 *  seedados: ficam disponíveis no catálogo para o operador criar se quiser.
 */

export type DefaultTemplate = {
  event_type: string;
  channel: "sms" | "whatsapp";
  body: string;
  enabled: number;
};

export const NOTIFICATION_TEMPLATE_DEFAULTS: DefaultTemplate[] = [
  // ─── Pagamento confirmado (SMS) — worker-notification.ts ───
  {
    event_type: "PaymentReceived",
    channel: "sms",
    enabled: 1,
    body: "Pagamento {{order.code}} no valor de {{payment.amount}} confirmado. Receberá os acessos do curso por e-mail.",
  },

  // ─── Acesso ao curso / matrícula concluída (SMS) — worker-notification.ts ───
  {
    event_type: "EnrolmentCompleted",
    channel: "sms",
    enabled: 1,
    body: `O seu acesso aos cursos da Academia Treesix já está disponível.

Aceda através do link: https://www.academiatreesix.com/users/sign_in

Login: o seu e-mail
Senha: caso seja o primeiro acesso, a senha será enviada por e-mail ou poderá defini-la clicando em "Esqueceu a senha?".

Após efectuar o login, aceda à opção O meu painel .`,
  },

  // ─── Recuperação de carrinho (SMS) — schedules/tasks/abandonedRemember.ts ───
  {
    event_type: "CartRecovery",
    channel: "sms",
    enabled: 1,
    body: `Hello! Notámos que iniciaste a inscrição em um dos nossos programas de inglês ☺️

Podes finalizar aqui:
https://checkout.academiatreesix.com/cart/{{order.code}}

Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },

  // ─── Referência a expirar hoje (SMS) — schedules/tasks/referenceExpiryRemember.ts ───
  {
    event_type: "ReferenceExpiring",
    channel: "sms",
    enabled: 1,
    body: `A sua referência de pagamento {{payment.reference_number}} (Entidade {{payment.entity}}) no valor de {{payment.amount}} expira hoje ({{payment.expiry}}). Efectue o pagamento para garantir o acesso ao curso.`,
  },

  // ─── Referência a expirar hoje (WhatsApp) — schedules/tasks/referenceExpiryRemember.ts ───
  {
    event_type: "ReferenceExpiring",
    channel: "whatsapp",
    enabled: 0,
    body: `Olá {{customer.first_name}}! ⏳

A tua referência de pagamento expira *hoje* ({{payment.expiry}}):

Entidade: {{payment.entity}}
Referência: {{payment.reference_number}}
Valor: {{payment.amount}}

Efectua o pagamento por Multicaixa para garantires o acesso ao curso. Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },

  // ─── Recuperação de carrinho (WhatsApp) — recover-payments.ts ───
  {
    event_type: "CartRecovery",
    channel: "whatsapp",
    enabled: 0,
    body: `Olá {{customer.first_name}}! 👋

Notámos que tiveste uma dificuldade com o pagamento da tua inscrição (ref. {{order.code}}).

✅ Já está tudo resolvido — podes tentar novamente agora mesmo:
https://checkout.academiatreesix.com/cart/{{order.code}}

Precisas de ajuda? Fala connosco:
https://wa.me/message/TFRDLMMC2L2TG1`,
  },
];
