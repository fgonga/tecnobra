import axios from "axios";
import { config } from "../config/env";

export type Envelope = {
  to: string;
  message: string;
  type?: string;
};

export class SmsService {
  private static get apiUrl() { return config.sms.apiUrl }
  private static get apiKey() { return config.sms.apiKey }
  static async send(envelope: Envelope) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          message: {
            api_key_app: this.apiKey,
            phone_number: envelope.to,
            message_body: envelope.message,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return response.data;
    } catch (error: any) {

      throw error;
    }
  }
}
