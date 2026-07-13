/**
 * Registo de builders de eventos de sistema.
 *
 * Cada builder transforma um evento interno (tabela `events`) no payload a
 * entregar a sistemas externos. Registar aqui novos builders Tecnobra
 * (ex.: alertas para sistemas de terceiros) à medida que forem criados.
 */
export interface EventPayloadBuilder {
  supports(type: string): boolean
  build(eventData: any): Promise<any>
}

export class EventBuilderRegistry {

  private static builders: EventPayloadBuilder[] = []

  static getBuilder(type: string): EventPayloadBuilder | null {
    return this.builders.find(b => b.supports(type)) || null
  }
}
