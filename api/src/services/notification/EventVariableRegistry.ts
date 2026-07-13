/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  Fonte única de variáveis disponíveis por event_type (checkout).
 *  Port/adaptação do EventVariableRegistry.php (projeto 2025).
 *
 *  Usado por:
 *   - TemplateRenderer (validação ao guardar — rejeita variáveis desconhecidas)
 *   - UI (painel "variáveis disponíveis" no editor de template)
 *   - preview / test-send (sample data por variável)
 */

export type NotificationVariable = { key: string; label: string; sample: string };

export class EventVariableRegistry {
  static readonly EVENTS = [
    "OrderCreated",
    "ReferenceGenerated",
    "PaymentReceived",
    "PaymentFailed",
    "EnrolmentCompleted",
    "CartRecovery",
  ] as const;

  /** Variáveis disponíveis em todos os eventos (marca + cliente). */
  static universal(): NotificationVariable[] {
    return [
      { key: "brand.name", label: "Nome da marca", sample: "Academia Treesix" },
      { key: "brand.phone", label: "Telefone da marca", sample: "+244 923 000 000" },
      { key: "brand.email", label: "E-mail da marca", sample: "geral@academiatreesix.com" },
      { key: "brand.website", label: "Website", sample: "https://www.academiatreesix.com" },
      { key: "customer.name", label: "Nome do cliente", sample: "João Manuel Silva" },
      { key: "customer.first_name", label: "Primeiro nome", sample: "João" },
      { key: "customer.email", label: "E-mail do cliente", sample: "joao@exemplo.com" },
      { key: "customer.phone", label: "Telefone do cliente", sample: "+244 923 111 222" },
    ];
  }

  /** Variáveis específicas por event_type. */
  static specific(eventType: string): NotificationVariable[] {
    switch (eventType) {
      case "OrderCreated":
        return [
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
          { key: "order.amount", label: "Valor da encomenda", sample: "75 000,00 Kz" },
        ];
      case "ReferenceGenerated":
        return [
          { key: "payment.entity", label: "Entidade", sample: "00999" },
          { key: "payment.reference", label: "Referência a pagar", sample: "901234567" },
          { key: "payment.amount", label: "Valor a pagar", sample: "75 000,00 Kz" },
          { key: "payment.expires_at", label: "Expira em", sample: "03/06/2026 23:59" },
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
        ];
      case "PaymentReceived":
        return [
          { key: "payment.amount", label: "Valor pago", sample: "75 000,00 Kz" },
          { key: "payment.method", label: "Método de pagamento", sample: "Multicaixa Express" },
          { key: "payment.reference", label: "Referência usada", sample: "901234567" },
          { key: "payment.date", label: "Data do pagamento", sample: "03/05/2026 14:30" },
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
        ];
      case "PaymentFailed":
        return [
          { key: "payment.amount", label: "Valor", sample: "75 000,00 Kz" },
          { key: "payment.method", label: "Método de pagamento", sample: "Multicaixa Express" },
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
          { key: "reason", label: "Motivo", sample: "saldo insuficiente" },
        ];
      case "EnrolmentCompleted":
        return [
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
          { key: "course.url", label: "Link de acesso", sample: "https://www.academiatreesix.com/users/sign_in" },
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
        ];
      case "CartRecovery":
        return [
          { key: "order.code", label: "Código da encomenda", sample: "OR-2026-00142" },
          { key: "course.name", label: "Curso", sample: "Desenvolvimento Web Full Stack" },
          { key: "order.amount", label: "Valor", sample: "75 000,00 Kz" },
          { key: "checkout.url", label: "Link para concluir", sample: "https://checkout.academiatreesix.com/cart/OR-2026-00142" },
        ];
      default:
        return [];
    }
  }

  /** Lista completa (universal + específicas) para um event_type. */
  static for(eventType: string): NotificationVariable[] {
    return [...this.universal(), ...this.specific(eventType)];
  }

  /** Conjunto de keys válidas para um event_type. */
  static keys(eventType: string): string[] {
    return this.for(eventType).map((v) => v.key);
  }

  /** Sample data plano para um event_type — { key => sample }. */
  static sampleFlat(eventType: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const v of this.for(eventType)) out[v.key] = v.sample;
    return out;
  }

  /** Sample data em árvore (compatível com o renderer). */
  static sampleTree(eventType: string): Record<string, any> {
    const tree: Record<string, any> = {};
    for (const [path, value] of Object.entries(this.sampleFlat(eventType))) {
      this.setPath(tree, path, value);
    }
    return tree;
  }

  /** Catálogo público de eventos para a UI — { event_type => [variables] }. */
  static catalog(): Record<string, NotificationVariable[]> {
    const out: Record<string, NotificationVariable[]> = {};
    for (const event of this.EVENTS) out[event] = this.for(event);
    return out;
  }

  static isValidEvent(eventType: string): boolean {
    return (this.EVENTS as readonly string[]).includes(eventType);
  }

  private static setPath(tree: Record<string, any>, path: string, value: any): void {
    const parts = path.split(".");
    let ref = tree;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        ref[part] = value;
        return;
      }
      if (typeof ref[part] !== "object" || ref[part] === null) ref[part] = {};
      ref = ref[part];
    });
  }
}
