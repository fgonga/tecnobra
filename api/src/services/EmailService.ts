/*
 *  Tecnobra — Envio de e-mail via SMTP (nodemailer).
 *
 *  Com USE_MOCK_EMAIL=true usa jsonTransport: nada é enviado, a mensagem é
 *  apenas registada no log (útil em desenvolvimento sem servidor SMTP).
 */

import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config/env";

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type EmailEnvelope = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  if (config.smtp.mock) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  } else {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.password }
        : undefined,
    });
  }
  return transporter;
}

export class EmailService {
  static async send(envelope: EmailEnvelope): Promise<{ id: string | null }> {
    const info = await getTransporter().sendMail({
      from: config.smtp.from,
      to: envelope.to,
      subject: envelope.subject,
      text: envelope.text,
      html: envelope.html ?? (envelope.text ? undefined : ""),
      attachments: envelope.attachments,
    });
    if (config.smtp.mock) {
      console.log("[EmailService][mock]", info.message);
    }
    return { id: info.messageId ?? null };
  }
}
