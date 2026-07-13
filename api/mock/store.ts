import { randomUUID } from "crypto";

// ─── AppyPay charges ─────────────────────────────────────────
export interface MockCharge {
  id: string;
  merchantTransactionId: string;
  amount: number;
  currency: string;
  description: string;
  /** Identificador semântico do método: "express", "ref", "qr", "etpa". */
  paymentMethod: string;
  /** ID exacto do método como vem no body (ex.: "GPO_xxx", "REF_xxx") — devolvido em GET /charges. */
  paymentMethodId: string;
  paymentInfo: any;
  /** AppyPay devolve sempre "Charge"/"PAYMENT" para charges feitas via API. */
  type: string;
  operation: string;
  status: "pending" | "paid" | "failed" | "refunded";
  /** Linkagem opcional para uma referência registada (REF charges). */
  referenceNumber?: string;
  referenceEntity?: string;
  referenceDueDate?: string;
  /** Recibos eletrónicos (eTPA). Base64 placeholder. */
  customerReceipt?: string;
  merchantReceipt?: string;
  /** Custom options, ex.: { SmartcardNumber, MerchantOrigin }. */
  options?: Record<string, unknown> | null;
  /** notify object enviado no body (telefone/email para SMS/Email notifications). */
  notify?: Record<string, unknown> | null;
  /** Source da resposta — "GPO" para express/qr, "REF" para referências, etc. */
  source: string;
  /** QR-specific. */
  qrCodeType?: "SINGLE" | "MULTIPLE";
  qrMinAmount?: number;
  qrMaxTransactions?: number;
  qrStartDate?: string;
  qrEndDate?: string;
  qrCodeArr?: string;
  createdAt: string;
  updatedAt: string;
  refunds: { amount: number; description: string; createdAt: string }[];
  /** Histórico de tentativas — só vem populado em GET /charges/:id. */
  transactionEvents: MockTransactionEvent[];
}

export interface MockTransactionEvent {
  id: number;
  transactionId: string;
  type: string;
  providerTransactionId: string;
  actionStatus: boolean;
  createdDate: string;
  responseStatus: {
    successful: boolean;
    status: string;
    code: number;
    message: string;
    source: string;
    sourceDetails: { attempt: number; type: string; code: string; message: string };
    attempt: number;
    type: string;
  };
}

// ─── AppyPay references (POST/GET /v2.0/references) ─────────
export interface MockReference {
  id: number;
  entity: string;
  referenceNumber: string;
  currency: string;
  amount: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  startDate: string;
  expirationDate: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

// ─── Thinkific ──────────────────────────────────────────────
export interface MockThinkificUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  external_id?: string;
  created_at: string;
}

export interface MockEnrollment {
  id: number;
  user_id: number;
  course_id?: number;
  bundle_id?: number;
  type: "course" | "bundle";
  activated_at?: string;
  expiry_date?: string;
  created_at: string;
}

// ─── SMS ────────────────────────────────────────────────────
export interface MockSms {
  id: string;
  to: string;
  message: string;
  sentAt: string;
}

// ─── WhatsApp ───────────────────────────────────────────────
export interface MockWhatsappMessage {
  id: string;
  phone: string;
  message: string;
  device: string;
  sentAt: string;
}

// ─── Store ──────────────────────────────────────────────────
class Store {
  charges: Map<string, MockCharge> = new Map();
  references: Map<string, MockReference> = new Map();
  users: Map<number, MockThinkificUser> = new Map();
  enrollments: Map<number, MockEnrollment> = new Map();
  smsInbox: MockSms[] = [];
  whatsappInbox: MockWhatsappMessage[] = [];

  private referenceAutoId = 1;
  private transactionEventAutoId = 1;
  private userSeq = 1000;
  private enrollSeq = 1;

  createCharge(
    data: Partial<Omit<MockCharge, "id" | "status" | "createdAt" | "updatedAt" | "refunds" | "transactionEvents">> & {
      merchantTransactionId: string;
      amount: number;
      currency: string;
      description: string;
      paymentMethod: string;
      paymentInfo: any;
    },
  ): MockCharge {
    const now = new Date().toISOString();
    const charge: MockCharge = {
      id: randomUUID(),
      merchantTransactionId: data.merchantTransactionId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      paymentMethod: data.paymentMethod,
      paymentMethodId: data.paymentMethodId ?? data.paymentMethod,
      paymentInfo: data.paymentInfo,
      type: data.type ?? "Charge",
      operation: data.operation ?? "PAYMENT",
      status: "pending",
      referenceNumber: data.referenceNumber,
      referenceEntity: data.referenceEntity,
      referenceDueDate: data.referenceDueDate,
      customerReceipt: data.customerReceipt,
      merchantReceipt: data.merchantReceipt,
      options: data.options ?? null,
      notify: data.notify ?? null,
      source: data.source ?? this.defaultSource(data.paymentMethod),
      qrCodeType: data.qrCodeType,
      qrMinAmount: data.qrMinAmount,
      qrMaxTransactions: data.qrMaxTransactions,
      qrStartDate: data.qrStartDate,
      qrEndDate: data.qrEndDate,
      qrCodeArr: data.qrCodeArr,
      createdAt: now,
      updatedAt: now,
      refunds: [],
      transactionEvents: [],
    };
    this.charges.set(charge.id, charge);
    return charge;
  }

  getCharge(id: string): MockCharge | undefined {
    return this.charges.get(id);
  }

  getChargeByMerchantId(merchantTransactionId: string): MockCharge | undefined {
    return [...this.charges.values()].find(
      (c) => c.merchantTransactionId === merchantTransactionId,
    );
  }

  setChargeStatus(id: string, status: MockCharge["status"]): MockCharge | undefined {
    const charge = this.charges.get(id);
    if (charge) {
      charge.status = status;
      charge.updatedAt = new Date().toISOString();
    }
    return charge;
  }

  recordTransactionEvent(
    chargeId: string,
    event: Omit<MockTransactionEvent, "id" | "transactionId" | "createdDate"> & {
      createdDate?: string;
    },
  ): MockTransactionEvent | undefined {
    const charge = this.charges.get(chargeId);
    if (!charge) return undefined;
    const ev: MockTransactionEvent = {
      id: this.transactionEventAutoId++,
      transactionId: chargeId,
      type: event.type,
      providerTransactionId: event.providerTransactionId,
      actionStatus: event.actionStatus,
      createdDate: event.createdDate ?? new Date().toISOString(),
      responseStatus: event.responseStatus,
    };
    charge.transactionEvents.push(ev);
    return ev;
  }

  listCharges(filters: {
    dateFrom?: string | null;
    dateTo?: string | null;
    amountFrom?: number | null;
    amountTo?: number | null;
    currency?: string | null;
    type?: string | null;
    merchantTransactionId?: string | null;
    limit?: number | null;
    skip?: number | null;
  }): { items: MockCharge[]; totalCount: number; hasMorePages: boolean } {
    let out = [...this.charges.values()];
    if (filters.dateFrom) out = out.filter((c) => c.createdAt >= filters.dateFrom!);
    if (filters.dateTo) out = out.filter((c) => c.createdAt <= filters.dateTo!);
    if (filters.amountFrom != null) out = out.filter((c) => c.amount >= filters.amountFrom!);
    if (filters.amountTo != null) out = out.filter((c) => c.amount <= filters.amountTo!);
    if (filters.currency) out = out.filter((c) => c.currency === filters.currency);
    if (filters.type) out = out.filter((c) => c.type === filters.type);
    if (filters.merchantTransactionId) {
      out = out.filter((c) => c.merchantTransactionId === filters.merchantTransactionId);
    }
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const totalCount = out.length;
    const skip = filters.skip ?? 0;
    const limit = filters.limit ?? totalCount;
    const items = out.slice(skip, skip + limit);
    const hasMorePages = skip + items.length < totalCount;
    return { items, totalCount, hasMorePages };
  }

  registerOrUpdateReference(input: {
    referenceNumber: string;
    currency?: string;
    minAmount: number | null;
    maxAmount: number | null;
    startDate: string;
    expirationDate: string;
    createdBy: string;
  }): { reference: MockReference; created: boolean } {
    const now = new Date().toISOString();
    const isActive = new Date(input.expirationDate).getTime() > Date.now();
    const existing = this.references.get(input.referenceNumber);

    if (existing) {
      existing.minAmount = input.minAmount;
      existing.maxAmount = input.maxAmount;
      existing.startDate = input.startDate;
      existing.expirationDate = input.expirationDate;
      existing.isActive = isActive;
      existing.updatedBy = input.createdBy;
      existing.updatedDate = now;
      if (input.currency) existing.currency = input.currency;
      return { reference: existing, created: false };
    }

    const ref: MockReference = {
      id: this.referenceAutoId++,
      entity: process.env.MOCK_APPYPAY_ENTITY || "00123",
      referenceNumber: input.referenceNumber,
      currency: input.currency ?? "AOA",
      amount: null,
      minAmount: input.minAmount,
      maxAmount: input.maxAmount,
      startDate: input.startDate,
      expirationDate: input.expirationDate,
      isActive,
      createdBy: input.createdBy,
      updatedBy: input.createdBy,
      createdDate: now,
      updatedDate: now,
    };
    this.references.set(ref.referenceNumber, ref);
    return { reference: ref, created: true };
  }

  getReference(referenceNumber: string): MockReference | undefined {
    return this.references.get(referenceNumber);
  }

  listReferences(filters: {
    amountFrom?: number | null;
    amountTo?: number | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    limit?: number | null;
    skip?: number | null;
  }): MockReference[] {
    let out = [...this.references.values()];
    if (filters.dateFrom) out = out.filter((r) => r.createdDate >= filters.dateFrom!);
    if (filters.dateTo) out = out.filter((r) => r.createdDate <= filters.dateTo!);
    if (filters.amountFrom != null) {
      out = out.filter((r) => (r.minAmount ?? r.amount ?? 0) >= filters.amountFrom!);
    }
    if (filters.amountTo != null) {
      out = out.filter((r) => (r.maxAmount ?? r.amount ?? Number.POSITIVE_INFINITY) <= filters.amountTo!);
    }
    out.sort((a, b) => b.createdDate.localeCompare(a.createdDate));
    const skip = filters.skip ?? 0;
    const limit = filters.limit ?? out.length;
    return out.slice(skip, skip + limit);
  }

  createUser(data: Omit<MockThinkificUser, "id" | "created_at">): MockThinkificUser {
    const user: MockThinkificUser = {
      id: this.userSeq++,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  getUserByEmail(email: string): MockThinkificUser | undefined {
    return [...this.users.values()].find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  createEnrollment(data: Omit<MockEnrollment, "id" | "created_at">): MockEnrollment {
    const enrollment: MockEnrollment = {
      id: this.enrollSeq++,
      ...data,
      created_at: new Date().toISOString(),
    };
    this.enrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  addSms(to: string, message: string): MockSms {
    const sms: MockSms = { id: randomUUID(), to, message, sentAt: new Date().toISOString() };
    this.smsInbox.push(sms);
    return sms;
  }

  addWhatsapp(phone: string, message: string, device: string): MockWhatsappMessage {
    const msg: MockWhatsappMessage = { id: randomUUID(), phone, message, device, sentAt: new Date().toISOString() };
    this.whatsappInbox.push(msg);
    return msg;
  }

  snapshot() {
    return {
      charges: [...this.charges.values()],
      references: [...this.references.values()],
      users: [...this.users.values()],
      enrollments: [...this.enrollments.values()],
      smsInbox: this.smsInbox,
      whatsappInbox: this.whatsappInbox,
    };
  }

  private defaultSource(paymentMethod: string): string {
    switch (paymentMethod) {
      case "ref":
        return "REF";
      case "qr":
      case "etpa":
        return "FTBAI";
      default:
        return "GPO";
    }
  }
}

export const store = new Store();
