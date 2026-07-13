import { Router } from "express";
import axios from "axios";
import { store, type MockCharge, type MockReference, type MockTransactionEvent } from "../store.js";

export const appypayRouter = Router();

function getWebhookUrl(): string {
  return (
    process.env.MOCK_WEBHOOK_URL ||
    `http://127.0.0.1:${process.env.APP_PORT || 8001}/api/webhook-9f2a3b7c9e8d`
  );
}

const DEFAULT_ENTITY = process.env.MOCK_APPYPAY_ENTITY || "00123";
const RECEIPT_PLACEHOLDER_CUSTOMER =
  "TUlOSVNURVJJTyBEQVMgICAgICANCkZJTkFOQ0FTICAgICAgICAgICAgDQpNT0NLIENVU1RPTUVSIFJFQ0VJUFQ=";
const RECEIPT_PLACEHOLDER_MERCHANT =
  "TUlOSVNURVJJTyBEQVMgICAgICANCkZJTkFOQ0FTICAgICAgICAgICAgDQpNT0NLIE1FUkNIQU5UIFJFQ0VJUFQ=";
const QR_CODE_PLACEHOLDER =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// ── OAuth token ────────────────────────────────────────────
appypayRouter.post("/oauth2/token", (_req, res) => {
  res.json({
    access_token: "mock-token-dev",
    token_type: "Bearer",
    expires_in: 3600,
  });
});

// ── Create charge (express / ref / aexpress / aref) ────────
appypayRouter.post("/v2.0/charges", (req, res) => {
  const { amount, description, merchantTransactionId, paymentMethod, paymentInfo, options, notify } =
    req.body ?? {};

  const isAsync = req.headers.accept?.includes("asyncapi");

  // O `paymentMethod` chega como string (ex.: "GPO_xxx", "REF_xxx") segundo a lib.
  const methodId = typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id ?? "";
  const method = inferMethodKind(methodId, paymentInfo);

  // Se for cobrança via referência registada, o `paymentInfo.referenceNumber`
  // tem de existir no store (criado via POST /references). Caso contrário
  // devolvemos 404 — alinha com o contrato real.
  let linkedRef: MockReference | undefined;
  if (method === "ref") {
    // Modo "gerada pelo portal": o checkout já NÃO envia paymentInfo.referenceNumber.
    // Nesse caso geramos a referência aqui (como faz o portal AppyPay real). Se vier
    // um referenceNumber (modo antigo / referência pré-registada), usamo-lo.
    const refNumber = paymentInfo?.referenceNumber
      ? String(paymentInfo.referenceNumber)
      : String(Date.now()).slice(-9);

    linkedRef = store.getReference(refNumber);
    if (!linkedRef) {
      // Auto-regista para o fluxo funcionar localmente, espelhando o /mock/ref-payment.
      const reg = store.registerOrUpdateReference({
        referenceNumber: refNumber,
        currency: "AOA",
        minAmount: 1,
        maxAmount: 10_000_000,
        startDate: new Date().toISOString(),
        expirationDate:
          paymentInfo?.dueDate || new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString(),
        createdBy: paymentInfo?.referenceNumber ? "checkout-auto" : "checkout-portal",
      });
      linkedRef = reg.reference;
    }
    if (!linkedRef.isActive) {
      return res.status(409).json({
        responseStatus: {
          successful: false,
          status: "Failed",
          code: 409,
          message: `Referência ${paymentInfo.referenceNumber} está inactiva/expirada.`,
          source: "REF",
          sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: "INACTIVE" },
        },
      });
    }
  }

  const charge = store.createCharge({
    merchantTransactionId,
    amount: Number(amount),
    currency: "AOA",
    description,
    paymentMethod: method,
    paymentMethodId: methodId,
    paymentInfo,
    options: options ?? null,
    notify: notify ?? null,
    referenceNumber: linkedRef?.referenceNumber,
    referenceEntity: linkedRef?.entity ?? (method === "ref" ? DEFAULT_ENTITY : undefined),
    referenceDueDate: paymentInfo?.dueDate ?? linkedRef?.expirationDate,
  });

  console.log(
    `[AppyPay Mock] Charge criado: ${charge.id} | ${merchantTransactionId} | ${amount} AOA | ${method}${isAsync ? " (async)" : ""}`,
  );

  if (isAsync) {
    res.status(202).json({
      id: charge.id,
      merchantTransactionId,
      amount,
      currency: "AOA",
      status: "PENDING",
    });
  } else if (method === "ref") {
    // REF gerada pelo portal: aceite para processamento, com a referência devolvida.
    res.json(buildCreateChargeResponse(charge, 101, "A solicitação foi aceita para processamento."));
  } else {
    res.json(buildCreateChargeResponse(charge, 102, "Aguardando autorização do utilizador."));
  }
});

// ── Create QR charge ───────────────────────────────────────
appypayRouter.post("/v2.0/qr-codes", (req, res) => {
  const {
    amount,
    description,
    merchantTransactionId,
    paymentMethod,
    paymentInfo,
    options,
    notify,
    qrCodeType,
    minAmount,
    maxTransactions,
    startDate,
    endDate,
  } = req.body ?? {};
  const methodId = typeof paymentMethod === "string" ? paymentMethod : paymentMethod?.id ?? "";

  const charge = store.createCharge({
    merchantTransactionId,
    amount: Number(amount),
    currency: "AOA",
    description,
    paymentMethod: "qr",
    paymentMethodId: methodId,
    paymentInfo,
    options: options ?? null,
    notify: notify ?? null,
    qrCodeType: qrCodeType ?? "SINGLE",
    qrMinAmount: minAmount != null ? Number(minAmount) : undefined,
    qrMaxTransactions: maxTransactions != null ? Number(maxTransactions) : undefined,
    qrStartDate: startDate,
    qrEndDate: endDate,
    qrCodeArr: QR_CODE_PLACEHOLDER,
  });

  console.log(
    `[AppyPay Mock] QR criado: ${charge.id} | ${merchantTransactionId} | ${qrCodeType ?? "SINGLE"}`,
  );

  res.json({
    data: {
      id: charge.id,
      qrCodeArr: QR_CODE_PLACEHOLDER,
      responseStatus: {
        successful: true,
        status: "Requested",
        code: 103,
        message: "QR Code gerado com sucesso.",
        source: "FTBAI",
      },
    },
  });
});

// ── List charges (GET /v2.0/charges) ──────────────────────
appypayRouter.get("/v2.0/charges", (req, res) => {
  res.json(buildListChargesResponse(req.query));
});

// ── Analytics charges (mesmo schema do list) ──────────────
appypayRouter.get("/v2.0/analytics/charges", (req, res) => {
  res.json(buildListChargesResponse(req.query));
});

// ── Get charge (GET /v2.0/charges/:id) ────────────────────
appypayRouter.get("/v2.0/charges/:id", (req, res) => {
  const id = req.params.id;
  const merchantTxId = toStr(req.query.merchantTransactionId);

  let charge = id ? store.getCharge(id) : undefined;
  if (!charge && merchantTxId) {
    charge = store.getChargeByMerchantId(merchantTxId);
  }
  if (!charge) {
    return res.status(404).json({
      responseStatus: {
        successful: false,
        status: "Failed",
        code: 404,
        message: "Charge not found.",
        source: "GPO",
        sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: "NOT_FOUND" },
      },
    });
  }
  res.json(buildGetChargeResponse(charge));
});

// ── Refund (POST /v2.0/charges/:id/refund) ────────────────
appypayRouter.post("/v2.0/charges/:id/refund", (req, res) => {
  const charge = store.getCharge(req.params.id);
  if (!charge) return res.status(404).json({ error: "Charge not found" });

  const { amount, description } = req.body ?? {};
  const refundAmount = amount != null ? Number(amount) : charge.amount;
  charge.refunds.push({ amount: refundAmount, description, createdAt: new Date().toISOString() });
  store.setChargeStatus(charge.id, "refunded");

  store.recordTransactionEvent(charge.id, {
    type: "REFUND",
    providerTransactionId: `REF-${Date.now()}`,
    actionStatus: true,
    responseStatus: {
      successful: true,
      status: "Success",
      code: 100,
      message: "Refund processado",
      source: charge.source,
      sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: "OK" },
      attempt: 1,
      type: "REFUND",
    },
  });

  console.log(`[AppyPay Mock] Refund: ${charge.id} | ${refundAmount} AOA`);
  res.json(buildCreateChargeResponse(charge, 100, "Refund processado com sucesso."));
});

// ── Register reference (POST /v2.0/references) ────────────
// Mesmo endpoint serve para registar, actualizar (renovar validade) e cancelar
// (passar `expirationDate` no passado). Suporta múltiplas referências por chamada.
appypayRouter.post("/v2.0/references", (req, res) => {
  const { paymentMethod, references, createdBy } = req.body ?? {};

  if (!paymentMethod) {
    return res.status(400).json({
      error: "paymentMethod é obrigatório.",
      hint: "Configure APPYPAY_REF na .env do mock e na do app.",
    });
  }
  if (!Array.isArray(references) || references.length === 0) {
    return res.status(400).json({ error: "references[] não pode estar vazio." });
  }

  const results = references.map((r: any) => {
    const refNumber = String(r?.referenceNumber ?? "");
    if (!/^\d{9,15}$/.test(refNumber)) {
      return {
        referenceNumber: refNumber,
        code: 22,
        message: "referenceNumber inválido (9-15 dígitos numéricos).",
      };
    }
    const minAmount = r?.minAmount != null ? Number(r.minAmount) : null;
    const maxAmount = r?.maxAmount != null ? Number(r.maxAmount) : null;
    if (minAmount != null && maxAmount != null && minAmount > maxAmount) {
      return {
        referenceNumber: refNumber,
        code: 22,
        message: "minAmount não pode ser maior que maxAmount.",
      };
    }

    const startDate = String(r?.startDate ?? new Date().toISOString());
    const expirationDate = String(
      r?.expirationDate ?? new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString(),
    );

    const { reference, created } = store.registerOrUpdateReference({
      referenceNumber: refNumber,
      currency: r?.currency,
      minAmount,
      maxAmount,
      startDate,
      expirationDate,
      createdBy: String(createdBy ?? "ISP-Manager"),
    });

    const action = !reference.isActive
      ? "cancelada"
      : created
        ? "registada"
        : "actualizada";

    const message =
      action === "cancelada"
        ? "Referência cancelada (expirationDate no passado)."
        : action === "actualizada"
          ? "Referência actualizada com sucesso."
          : "Referência registada com sucesso.";

    console.log(
      `[AppyPay Mock] Reference ${refNumber} ${action} (entity ${reference.entity}, exp ${expirationDate})`,
    );

    return {
      referenceNumber: reference.referenceNumber,
      code: 100,
      message,
    };
  });

  res.json({ references: results });
});

// ── List references (GET /v2.0/references) ───────────────
appypayRouter.get("/v2.0/references", (req, res) => {
  const { amountFrom, amountTo, dateFrom, dateTo, limit, skip } = req.query;
  const list = store.listReferences({
    amountFrom: toNum(amountFrom),
    amountTo: toNum(amountTo),
    dateFrom: toStr(dateFrom),
    dateTo: toStr(dateTo),
    limit: toNum(limit),
    skip: toNum(skip),
  });
  res.json({ references: list.map(buildReferenceListItem) });
});

// ── Dashboard actions (chamadas pelo dashboard HTML) ───────
appypayRouter.post("/mock/action", async (req, res) => {
  const { chargeId, action } = req.body as { chargeId: string; action: string };
  const charge = store.getCharge(chargeId);
  if (!charge) return res.status(404).json({ error: "Charge not found" });

  let code: number;
  let successful: boolean;
  let status: string;
  let message: string;
  let nextStatus: MockCharge["status"];

  switch (action) {
    case "approve":
      code = 100; successful = true; status = "Success";
      message = "Obrigado! O seu pagamento foi registado com Sucesso.";
      nextStatus = "paid";
      break;
    case "refuse_expired":
      code = 211; successful = false; status = "Failed";
      message = "O prazo de pagamento expirou. Por favor, tente novamente.";
      nextStatus = "failed";
      break;
    case "refuse_unauthorized":
      code = 231; successful = false; status = "Failed";
      message = "Pagamento não autorizado. Por favor, verifique os seus dados.";
      nextStatus = "failed";
      break;
    case "refuse_phone_inactive":
      code = 200; successful = false; status = "Failed";
      message = "O número de telemóvel não está ativo no Multicaixa Express.";
      nextStatus = "failed";
      break;
    default:
      return res.status(400).json({ error: "Unknown action" });
  }

  store.setChargeStatus(chargeId, nextStatus);

  // Para eTPA aprovado, popular recibos placeholders.
  if (nextStatus === "paid" && (charge.paymentMethod === "qr" || charge.paymentMethod === "etpa")) {
    charge.customerReceipt = charge.customerReceipt ?? RECEIPT_PLACEHOLDER_CUSTOMER;
    charge.merchantReceipt = charge.merchantReceipt ?? RECEIPT_PLACEHOLDER_MERCHANT;
  }

  store.recordTransactionEvent(chargeId, {
    type: "AUTH",
    providerTransactionId: `MOCK-${Date.now()}`,
    actionStatus: successful,
    responseStatus: {
      successful,
      status,
      code,
      message,
      source: charge.source,
      sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: successful ? "OK" : "DENIED" },
      attempt: 1,
      type: "AUTH",
    },
  });

  const payload = buildWebhookPayload(charge, { successful, status, code, message });

  try {
    console.log(`[AppyPay Mock] → Webhook payload enviado para ${getWebhookUrl()}:`);
    console.log(JSON.stringify(payload, null, 2));
    const response = await axios.post(getWebhookUrl(), payload);
    console.log(`[AppyPay Mock] ← Resposta [${response.status}]:`);
    console.log(JSON.stringify(response.data, null, 2));
    res.json({ ok: true, action, merchantTransactionId: charge.merchantTransactionId });
  } catch (err: any) {
    console.error(`[AppyPay Mock] ✗ Falha ao disparar webhook: ${err.message}`);
    if (err.response) {
      console.error(`[AppyPay Mock]   status: ${err.response.status}`);
      console.error(`[AppyPay Mock]   body:`, JSON.stringify(err.response.data, null, 2));
    }
    res.status(500).json({ error: "Webhook failed", detail: err.message });
  }
});

// ── Simular pagamento de uma referência registada ─────────
// Cria uma charge nova ligada à referência e dispara webhook como pagamento
// confirmado. É o cenário canónico de uma referência permanente: o cliente
// paga via Multicaixa e a AppyPay notifica-nos.
appypayRouter.post("/mock/ref-payment", async (req, res) => {
  const { referenceNumber, amount, merchantTransactionId, entity, strict } = req.body as {
    referenceNumber: string;
    amount: number;
    merchantTransactionId?: string;
    entity?: string;
    strict?: boolean;
  };

  if (!referenceNumber || !/^\d{9,15}$/.test(referenceNumber)) {
    return res.status(400).json({ error: "referenceNumber inválido (9-15 dígitos)." });
  }
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "amount inválido." });
  }

  // Auto-regista a referência se ainda não existir — flow ad-hoc para
  // testar o webhook sem precisar primeiro de bater no POST /references.
  // Se quiseres comportamento estrito (404 se não registada), passa
  // `strict: true` no body — equivale ao comportamento da AppyPay real.
  let ref = store.getReference(referenceNumber);
  let autoCreated = false;
  if (!ref) {
    if (strict) return res.status(404).json({ error: "Reference not found (strict mode)" });
    const result = store.registerOrUpdateReference({
      referenceNumber,
      currency: "AOA",
      minAmount: 1,
      maxAmount: 10_000_000,
      startDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000).toISOString(),
      createdBy: "ISP-Adhoc",
    });
    ref = result.reference;
    autoCreated = true;
    if (entity) ref.entity = entity;
    console.log(`[AppyPay Mock] Reference ${referenceNumber} auto-registada (ad-hoc, entity ${ref.entity})`);
  }

  if (!ref.isActive && strict) {
    return res.status(409).json({ error: "Reference inactive/expired" });
  }

  if (strict) {
    const min = ref.minAmount ?? 0;
    const max = ref.maxAmount ?? Number.POSITIVE_INFINITY;
    if (amount < min || amount > max) {
      return res.status(422).json({
        error: `Amount fora do intervalo permitido [${min}, ${max}].`,
      });
    }
  }

  const mtid = merchantTransactionId || `RP${Date.now().toString().slice(-13)}`;

  const charge = store.createCharge({
    merchantTransactionId: mtid,
    amount: Number(amount),
    currency: ref.currency,
    description: `Pagamento via referência ${ref.referenceNumber}`,
    paymentMethod: "ref",
    paymentMethodId: process.env.APPYPAY_REF || "REF_mock",
    paymentInfo: { referenceNumber: ref.referenceNumber },
    referenceNumber: ref.referenceNumber,
    referenceEntity: entity || ref.entity,
  });
  store.setChargeStatus(charge.id, "paid");

  store.recordTransactionEvent(charge.id, {
    type: "PAYMENT",
    providerTransactionId: `MCX-${Date.now()}`,
    actionStatus: true,
    responseStatus: {
      successful: true,
      status: "Success",
      code: 100,
      message: "Pagamento por referência confirmado.",
      source: "REF",
      sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: "OK" },
      attempt: 1,
      type: "PAYMENT",
    },
  });

  const payload = buildWebhookPayload(charge, {
    successful: true,
    status: "Success",
    code: 100,
    message: "Obrigado! O seu pagamento foi registado com Sucesso.",
  });

  try {
    console.log(
      `[AppyPay Mock] → Webhook (REF payment) para ${getWebhookUrl()}: ${ref.referenceNumber} | ${amount} ${ref.currency}`,
    );
    console.log(JSON.stringify(payload, null, 2));
    const response = await axios.post(getWebhookUrl(), payload);
    console.log(`[AppyPay Mock] ← Resposta [${response.status}]:`, JSON.stringify(response.data, null, 2));
    res.json({
      ok: true,
      chargeId: charge.id,
      merchantTransactionId: mtid,
      referenceNumber: ref.referenceNumber,
      entity: charge.referenceEntity,
      amount,
      autoCreated,
    });
  } catch (err: any) {
    console.error(`[AppyPay Mock] ✗ Webhook falhou: ${err.message}`);
    res.status(500).json({ error: "Webhook failed", detail: err.message });
  }
});

// ── Helpers ────────────────────────────────────────────────
function buildListChargesResponse(query: Record<string, unknown>) {
  const { items, totalCount, hasMorePages } = store.listCharges({
    dateFrom: toStr(query.dateFrom),
    dateTo: toStr(query.dateTo),
    amountFrom: toNum(query.amountFrom),
    amountTo: toNum(query.amountTo),
    currency: toStr(query.currency),
    type: toStr(query.type),
    merchantTransactionId: toStr(query.merchantTransactionId),
    limit: toNum(query.limit),
    skip: toNum(query.skip),
  });
  return {
    payments: items.map((c) => buildChargeListItem(c)),
    totalCount,
    hasMorePages,
  };
}

function buildCreateChargeResponse(charge: MockCharge, code: number, message: string) {
  const successful = code === 100 || code === 101;
  const status =
    code === 100 ? "Success" : code === 101 || code === 102 ? "Pending" : "Failed";
  return {
    id: charge.id,
    merchantTransactionId: charge.merchantTransactionId,
    amount: charge.amount,
    options: charge.options ?? null,
    directDebit: null,
    reference: charge.referenceNumber
      ? {
          referenceNumber: charge.referenceNumber,
          dueDate: charge.referenceDueDate ?? "",
          entity: charge.referenceEntity ?? DEFAULT_ENTITY,
        }
      : null,
    eletronicReceipt: charge.customerReceipt
      ? {
          customerReceipt: charge.customerReceipt,
          merchantReceipt: charge.merchantReceipt,
        }
      : null,
    responseStatus: {
      successful,
      status,
      code,
      message,
      source: charge.source,
      sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: "OK" },
      attempt: 1,
      type: charge.type,
    },
  };
}

function buildGetChargeResponse(charge: MockCharge) {
  const code = charge.status === "paid" ? 100 : charge.status === "failed" ? 211 : 102;
  const message = codeMessage(code);
  const base = buildCreateChargeResponse(charge, code, message) as Record<string, unknown>;
  base.transactionEvents = charge.transactionEvents.map((e) => buildTransactionEvent(e));
  return base;
}

function buildChargeListItem(charge: MockCharge) {
  return {
    id: charge.id,
    merchantTransactionId: charge.merchantTransactionId,
    type: charge.type,
    operation: charge.operation,
    amount: charge.amount,
    currency: charge.currency,
    status: chargeToApiStatus(charge.status),
    description: charge.description,
    disputes: false,
    applicationFeeAmount: 0,
    paymentMethod: charge.paymentMethodId,
    createdDate: charge.createdAt,
    updatedDate: charge.updatedAt,
    options: charge.options ?? null,
    reference: charge.referenceNumber
      ? {
          referenceNumber: charge.referenceNumber,
          dueDate: charge.referenceDueDate ?? "",
          entity: charge.referenceEntity ?? DEFAULT_ENTITY,
        }
      : null,
  };
}

function buildTransactionEvent(e: MockTransactionEvent) {
  return {
    id: e.id,
    transactionId: e.transactionId,
    type: e.type,
    providerTransactionId: e.providerTransactionId,
    actionStatus: e.actionStatus,
    createdDate: e.createdDate,
    responseStatus: {
      successful: e.responseStatus.successful,
      status: e.responseStatus.status,
      code: e.responseStatus.code,
      message: e.responseStatus.message,
      source: e.responseStatus.source,
      sourceDetails: e.responseStatus.sourceDetails,
      attempt: e.responseStatus.attempt,
      type: e.responseStatus.type,
    },
  };
}

function buildReferenceListItem(r: MockReference) {
  return {
    id: r.id,
    entity: r.entity,
    referenceNumber: r.referenceNumber,
    currency: r.currency,
    amount: r.amount,
    minAmount: r.minAmount,
    maxAmount: r.maxAmount,
    startDate: r.startDate,
    expirationDate: r.expirationDate,
    isActive: r.isActive,
    createdBy: r.createdBy,
    updatedBy: r.updatedBy,
    createdDate: r.createdDate,
    updatedDate: r.updatedDate,
  };
}

function buildWebhookPayload(
  charge: MockCharge,
  rs: { successful: boolean; status: string; code: number; message: string },
) {
  return {
    id: charge.id,
    merchantTransactionId: charge.merchantTransactionId,
    amount: charge.amount,
    options: charge.options ?? null,
    directDebit: null,
    reference: charge.referenceNumber
      ? {
          referenceNumber: charge.referenceNumber,
          dueDate: charge.referenceDueDate ?? "",
          entity: charge.referenceEntity ?? DEFAULT_ENTITY,
        }
      : null,
    eletronicReceipt: charge.customerReceipt
      ? {
          customerReceipt: charge.customerReceipt,
          merchantReceipt: charge.merchantReceipt,
        }
      : null,
    responseStatus: {
      successful: rs.successful,
      status: rs.status,
      code: rs.code,
      message: rs.message,
      source: charge.source,
      sourceDetails: { attempt: 1, type: "NONE", code: "NONE", message: rs.successful ? "OK" : "DENIED" },
    },
  };
}

function chargeToApiStatus(s: MockCharge["status"]): string {
  switch (s) {
    case "paid":
    case "refunded":
      return "Success";
    case "failed":
      return "Failed";
    case "pending":
    default:
      return "Pending";
  }
}

function inferMethodKind(methodId: string, paymentInfo: any): string {
  // A AppyPay distingue por prefixo do paymentMethod (GPO_xxx, REF_xxx).
  if (/^REF_/i.test(methodId)) return "ref";
  if (/^GPO_/i.test(methodId)) {
    return paymentInfo?.referenceNumber ? "ref" : "express";
  }
  if (paymentInfo?.referenceNumber) return "ref";
  if (paymentInfo?.posCode) return "qr";
  if (paymentInfo?.phoneNumber) return "express";
  // Sem paymentInfo no /charges => REF gerada pelo portal (o express envia
  // sempre phoneNumber; o QR vai para /qr-codes). Cobre o caso de APPYPAY_REF
  // vazio no env do mock, em que o methodId chega sem o prefixo REF_.
  return paymentInfo ? "express" : "ref";
}

function codeMessage(code: number): string {
  switch (code) {
    case 100: return "Obrigado! O seu pagamento foi registado com Sucesso.";
    case 101: return "A solicitação foi aceita para processamento.";
    case 102: return "Aguardando autorização do utilizador.";
    case 200: return "O número de telemóvel não está ativo no Multicaixa Express.";
    case 211: return "O prazo de pagamento expirou.";
    case 231: return "Pagamento não autorizado.";
    default: return "Estado desconhecido.";
  }
}

function toStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v);
  return s === "" ? null : s;
}

function toNum(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
