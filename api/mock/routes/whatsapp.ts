import { Router } from "express";
import { store } from "../store.js";

export const whatsappRouter = Router();

whatsappRouter.post("/send/message", (req, res) => {
  const { phone, message } = req.body as { phone: string; message: string };
  const device = (req.headers["x-device-id"] as string) || "unknown";

  const msg = store.addWhatsapp(phone || "unknown", message || "", device);
  console.log(`[WhatsApp Mock] Device: ${device} → Para: ${phone}`);
  console.log(`[WhatsApp Mock] Mensagem:\n${message}`);

  res.json({ success: true, id: msg.id });
});
