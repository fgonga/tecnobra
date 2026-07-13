import { Router } from "express";
import { store } from "../store.js";

export const smsRouter = Router();

smsRouter.post("/api/v2/send_message", (req, res) => {
  const { message } = req.body as { message: { phone_number: string; message_body: string } };
  const to = message?.phone_number || "unknown";
  const body = message?.message_body || "";

  const sms = store.addSms(to, body);
  console.log(`[SMS Mock] Para: ${to}`);
  console.log(`[SMS Mock] Mensagem: ${body}`);

  res.json({ success: true, id: sms.id, status: "sent" });
});
