/*
 *  Tecnobra — Fonte única de variáveis disponíveis por event_type.
 *
 *  Usado por:
 *   - TemplateRenderer (validação ao guardar — rejeita variáveis desconhecidas)
 *   - UI (painel "variáveis disponíveis" no editor de template)
 *   - preview / test-send (sample data por variável)
 */

export type NotificationVariable = { key: string; label: string; sample: string };

export class EventVariableRegistry {
  static readonly EVENTS = [
    "WorkerCardIssued",
    "VisitorCardIssued",
    "UnreturnedToolAlert",
    "LowStockAlert",
  ] as const;

  /** Variáveis disponíveis em todos os eventos (marca/organização). */
  static universal(): NotificationVariable[] {
    return [
      { key: "brand.name", label: "Nome da organização", sample: "Tecnobra" },
      { key: "obra.nome", label: "Nome da obra", sample: "Edifício Atlântico" },
      { key: "obra.codigo", label: "Código da obra", sample: "OBR-001" },
    ];
  }

  /** Variáveis específicas por event_type. */
  static specific(eventType: string): NotificationVariable[] {
    switch (eventType) {
      case "WorkerCardIssued":
        return [
          { key: "trabalhador.nome", label: "Nome do trabalhador", sample: "João Manuel Silva" },
          { key: "trabalhador.primeiro_nome", label: "Primeiro nome", sample: "João" },
          { key: "trabalhador.funcao", label: "Função", sample: "Pedreiro" },
          { key: "empresa.nome", label: "Empresa", sample: "Construtora Alfa, Lda." },
          { key: "cartao.link", label: "Ligação do cartão digital", sample: "https://tecnobra.local/c/AbC123xYz" },
        ];
      case "VisitorCardIssued":
        return [
          { key: "visitante.nome", label: "Nome do visitante", sample: "Maria Fernandes" },
          { key: "visitante.motivo", label: "Motivo da visita", sample: "Reunião de fiscalização" },
          { key: "visitante.valido_de", label: "Válido de", sample: "15/07/2026 08:00" },
          { key: "visitante.valido_ate", label: "Válido até", sample: "15/07/2026 18:00" },
          { key: "cartao.link", label: "Ligação do cartão digital", sample: "https://tecnobra.local/c/AbC123xYz" },
        ];
      case "UnreturnedToolAlert":
        return [
          { key: "equipamento.nome", label: "Equipamento/ferramenta", sample: "Berbequim Bosch GSB 13" },
          { key: "equipamento.codigo", label: "Código do equipamento", sample: "FER-042" },
          { key: "trabalhador.nome", label: "Responsável", sample: "João Manuel Silva" },
          { key: "empresa.nome", label: "Empresa do responsável", sample: "Construtora Alfa, Lda." },
        ];
      case "LowStockAlert":
        return [
          { key: "material.nome", label: "Material", sample: "Cimento 42,5R" },
          { key: "material.stock_atual", label: "Stock atual", sample: "12" },
          { key: "material.stock_minimo", label: "Stock mínimo", sample: "50" },
          { key: "material.unidade", label: "Unidade", sample: "saco" },
        ];
      default:
        return [];
    }
  }

  static all(eventType: string): NotificationVariable[] {
    return [...this.universal(), ...this.specific(eventType)];
  }

  /** Catálogo completo (para a UI). */
  static catalog() {
    return this.EVENTS.map((event) => ({
      event_type: event,
      variables: this.all(event),
    }));
  }

  static isValidEvent(eventType: string): boolean {
    return (this.EVENTS as readonly string[]).includes(eventType);
  }

  /** Chaves permitidas num template do evento (para validação). */
  static keys(eventType: string): string[] {
    return this.all(eventType).map((v) => v.key);
  }

  /** Árvore de dados de exemplo ({ trabalhador: { nome: ... } }) para preview. */
  static sampleTree(eventType: string): Record<string, any> {
    const tree: Record<string, any> = {};
    for (const v of this.all(eventType)) {
      const parts = v.key.split(".");
      let node = tree;
      for (let i = 0; i < parts.length - 1; i++) {
        node[parts[i]] = node[parts[i]] ?? {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = v.sample;
    }
    return tree;
  }
}
