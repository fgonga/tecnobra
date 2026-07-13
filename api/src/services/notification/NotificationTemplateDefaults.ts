/*
 *  Tecnobra — Mensagens default por event_type × channel (SMS / WhatsApp / E-mail).
 *  Textos em português de Portugal. O operador pode editar/desativar na UI.
 */

export type DefaultTemplate = {
  event_type: string;
  channel: "sms" | "whatsapp" | "email";
  subject?: string | null;
  body: string;
  enabled: number;
};

export const NOTIFICATION_TEMPLATE_DEFAULTS: DefaultTemplate[] = [
  // ─── Cartão de trabalhador emitido ───
  {
    event_type: "WorkerCardIssued",
    channel: "email",
    enabled: 1,
    subject: "O seu cartão de acesso à obra {{obra.nome}}",
    body: `Olá {{trabalhador.primeiro_nome}},

O seu cartão digital de acesso à obra {{obra.nome}} já está disponível.

Apresente o código QR na portaria para registar a entrada e a saída.
Pode abrir o cartão em qualquer momento através desta ligação:
{{cartao.link}}

{{brand.name}}`,
  },
  {
    event_type: "WorkerCardIssued",
    channel: "whatsapp",
    enabled: 1,
    body: `Olá {{trabalhador.primeiro_nome}}! O seu cartão de acesso à obra {{obra.nome}} está pronto. Abra e apresente na portaria: {{cartao.link}}`,
  },
  {
    event_type: "WorkerCardIssued",
    channel: "sms",
    enabled: 0,
    body: `{{brand.name}}: o seu cartão de acesso à obra {{obra.nome}} está disponível em {{cartao.link}}`,
  },

  // ─── Cartão de visitante emitido ───
  {
    event_type: "VisitorCardIssued",
    channel: "email",
    enabled: 1,
    subject: "Cartão de visitante — {{obra.nome}}",
    body: `Olá {{visitante.nome}},

Foi criado um cartão de visitante para a obra {{obra.nome}}.
Validade: de {{visitante.valido_de}} até {{visitante.valido_ate}}.

Apresente o código QR na portaria:
{{cartao.link}}

{{brand.name}}`,
  },
  {
    event_type: "VisitorCardIssued",
    channel: "whatsapp",
    enabled: 1,
    body: `Olá {{visitante.nome}}! O seu cartão de visitante da obra {{obra.nome}} (válido até {{visitante.valido_ate}}) está aqui: {{cartao.link}}`,
  },

  // ─── Ferramenta não devolvida ───
  {
    event_type: "UnreturnedToolAlert",
    channel: "email",
    enabled: 1,
    subject: "Alerta: {{equipamento.nome}} não foi devolvido — {{obra.nome}}",
    body: `Alerta de fim de dia na obra {{obra.nome}}:

O equipamento {{equipamento.nome}} ({{equipamento.codigo}}) não foi devolvido.
Responsável: {{trabalhador.nome}} ({{empresa.nome}}).

Verifique e regularize a situação.

{{brand.name}}`,
  },
  {
    event_type: "UnreturnedToolAlert",
    channel: "whatsapp",
    enabled: 1,
    body: `⚠️ {{obra.nome}}: {{equipamento.nome}} ({{equipamento.codigo}}) não foi devolvido. Responsável: {{trabalhador.nome}} ({{empresa.nome}}).`,
  },

  // ─── Stock baixo ───
  {
    event_type: "LowStockAlert",
    channel: "email",
    enabled: 1,
    subject: "Alerta de stock baixo: {{material.nome}} — {{obra.nome}}",
    body: `O material {{material.nome}} na obra {{obra.nome}} atingiu o stock mínimo.

Stock atual: {{material.stock_atual}} {{material.unidade}}
Stock mínimo: {{material.stock_minimo}} {{material.unidade}}

Considere fazer uma nova encomenda.

{{brand.name}}`,
  },
  {
    event_type: "LowStockAlert",
    channel: "whatsapp",
    enabled: 1,
    body: `⚠️ Stock baixo na obra {{obra.nome}}: {{material.nome}} — {{material.stock_atual}} {{material.unidade}} (mínimo {{material.stock_minimo}}).`,
  },
];
