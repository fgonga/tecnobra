/*
 *  Tecnobra — Geração de códigos QR (biblioteca `qrcode`).
 */

import QRCode from "qrcode";

const OPTIONS = {
  errorCorrectionLevel: "M" as const,
  margin: 1,
  width: 320,
};

export class QrService {
  /** Data-URL PNG (para renderizar no frontend/cartão). */
  static async toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, OPTIONS);
  }

  /** Buffer PNG (para anexos de e-mail). */
  static async toPngBuffer(text: string): Promise<Buffer> {
    return QRCode.toBuffer(text, { ...OPTIONS, type: "png" });
  }
}
