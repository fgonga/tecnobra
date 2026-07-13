
import {BaseModel} from "./base.model";

export interface Config {
  id: number;
  nome_organizacao: string;
  logo_url: string | null;
  events_dispatch_interval: number;
  message_cost: number;
  alertas_ativos: boolean | number;
  alerta_ferramentas_hora: string;   // "HH:MM" — hora do alerta de ferramentas não devolvidas
  stock_alerta_ativo: boolean | number;
}

export class ConfigModel extends BaseModel {
    static tableName = "parametrization";
    static allowedColumns = [
      "id", "nome_organizacao", "logo_url", "events_dispatch_interval",
      "message_cost", "alertas_ativos", "alerta_ferramentas_hora", "stock_alerta_ativo",
      "created_at", "updated_at",
    ];
}
