import axios from "axios";
import { config } from "../config/env";

/**
 * Envio de mensagens WhatsApp via o gateway configurado.
 * Mesmo padrão usado em HelpdeskService (POST {apiUrl}/send/message).
 * Cai no mock quando USE_MOCK_WHATSAPP=true.
 */
/**
 * Erro do gateway WhatsApp que preserva o request enviado e a resposta recebida,
 * para depuração no Playground (e mensagem legível para o utilizador).
 */
export class WhatsappGatewayError extends Error {
  status?: number;
  request: { url: string; body: any };
  response: any;
  constructor(
    message: string,
    info: { status?: number; request: { url: string; body: any }; response: any }
  ) {
    super(message);
    this.name = "WhatsappGatewayError";
    this.status = info.status;
    this.request = info.request;
    this.response = info.response;
  }
}

export class WhatsappService {
  static async send(to: string, message: string): Promise<void> {
    const destination = to || config.whatsapp.phone;
    const url = `${config.whatsapp.apiUrl}/send/message`;
    const requestBody = { phone: destination, message };
    try {
      await axios.post(url, requestBody, {
        headers: { "X-Device-Id": config.whatsapp.deviceId },
        auth: config.whatsapp.user
          ? { username: config.whatsapp.user, password: config.whatsapp.password }
          : undefined,
        timeout: 10_000,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error(`[Whatsapp] POST ${url} falhou`, {
        status,
        body: typeof data === "string" ? data : JSON.stringify(data),
        message: err?.message,
      });
      const gatewayMsg =
        (typeof data === "string" && data) ||
        data?.message ||
        data?.error ||
        data?.detail ||
        err?.message ||
        "erro desconhecido";
      throw new WhatsappGatewayError(`Whatsapp gateway ${status ?? ""}: ${gatewayMsg}`.trim(), {
        status,
        request: { url, body: requestBody },
        response: data ?? null,
      });
    }
  }
}
