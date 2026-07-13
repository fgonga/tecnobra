/*
 *  Copyright © 2021 - 2026
 *  Bantu Internet Technologies, Lda. Todos os direitos reservados.
 *
 *  SDK interno Cegid Vendus — tipos.
 *  Fonte: https://www.vendus.co.ao/ws/v1.1/ (documents, authentication).
 */

/** "tests" não comunica à AGT (sandbox); "normal" emite documento real. */
export type VendusMode = "normal" | "tests";

/**
 * Tipos de documento.
 *  FT  Fatura | FS Fatura simplificada | FR Fatura-recibo | NC Nota de crédito
 *  RG  Recibo | DC Conta corrente | GT/GR/GD/GA Guias | PF Pró-forma | OT Outros | EC Conta
 */
export type DocumentType =
  | "FT" | "FS" | "FR" | "NC" | "RG"
  | "DC" | "GT" | "GR" | "GD" | "GA" | "PF" | "OT" | "EC";

/** N = Normal | A = Anulado | F = Faturado (transformado em fatura). */
export type DocumentStatus = "N" | "A" | "F";

/** Regimes de IVA. ISE exige tax_exemption + tax_exemption_law. */
export type TaxId = "NOR" | "INT" | "RED" | "ISE" | "OUT";

/** P = Produto | S = Serviço | O = Outro | I = Imposto | E = Taxa. */
export type ItemTypeId = "P" | "S" | "O" | "I" | "E";

export interface VendusClientInfo {
  id?: number;
  /** NIF — obrigatório acima do limite legal e para faturas nominais. */
  fiscal_id?: string;
  name?: string;
  address?: string;
  postalcode?: string;
  city?: string;
  phone?: string;
  email?: string;
  /** ISO 3166-1 alpha-2 (ex.: "AO", "PT"). */
  country?: string;
  send_email?: "yes" | "no";
}

export interface VendusItem {
  /** id OU reference é obrigatório se o artigo já existe no catálogo. */
  id?: number;
  reference?: string;
  qty: number;
  type_id?: ItemTypeId;
  title?: string;
  /** Preço unitário com imposto incluído. */
  gross_price?: number;
  supply_price?: number;
  tax_id?: TaxId;
  /** Código de isenção (ex.: "M40"), só quando tax_id = "ISE". */
  tax_exemption?: string;
  tax_exemption_law?: string;
  discount_amount?: number;
  discount_percentage?: string;
  stock_control?: 0 | 1;
  unit_id?: number;
  category_id?: number;
  text?: string;
  /** Obrigatório em Notas de Crédito (NC): liga o item à linha do documento original. */
  reference_document?: {
    document_number: string;   // ex.: "FR 01P2026/2"
    document_row?: number;     // linha do documento original (1 = primeira)
    reference_id?: number | string;
  };
}

export interface VendusPayment {
  /** ID do método de pagamento configurado na conta Vendus. */
  id: string | number;
  amount: number;
  date_due?: string;
}

export interface CreateDocumentInput {
  /** POS / caixa. Se omitido, usa o registerId default do cliente SDK. */
  register_id?: number;
  type: DocumentType;
  date?: string;
  date_due?: string;
  date_supply?: string;
  notes?: string;
  external_reference?: string;
  mode?: VendusMode;
  discount_amount?: number;
  discount_percentage?: string;
  stock_operation?: "in" | "out" | "none";
  client?: VendusClientInfo;
  items: VendusItem[];
  payments?: VendusPayment[];
}

export interface VendusDocument {
  id: number;
  type: DocumentType;
  number: string;
  date: string;
  amount_gross: number;
  amount_net: number;
  hash?: string;
  atcud?: string;
  status: DocumentStatus;
  payment_status?: "pending" | "expired" | "paid";
  /** Campos extra na view "detailed" (taxes, items, client, payments, ...). */
  [key: string]: any;
}

export interface ListDocumentsParams {
  store_id?: number;
  register_id?: number;
  client_id?: number;
  client_fiscal_id?: string;
  /** Um ou vários tipos separados por vírgula (ex.: "FT,FR"). */
  type?: string;
  subtype?: string;
  since?: string;
  until?: string;
  status?: DocumentStatus;
  q?: string;
  external_reference?: string;
  view?: "normal" | "detailed";
  page?: number;
  per_page?: number;
}

export type DocumentOutput = "auto" | "pdf_url" | "pdf" | "html" | "escpos" | "json";

/* ───────────────────────── Registers ───────────────────────── */

/** Caixa/POS da conta Vendus. O VENDUS_REGISTER_ID é o `id` da caixa type="api". */
export interface VendusRegister {
  id: number;
  store_id?: number;
  title?: string;
  /** "api" = caixa para emissão via API (a que se usa no VENDUS_REGISTER_ID). */
  type?: string;
  status?: string;
  document_type_id?: string;
  [key: string]: any;
}

/* ───────────────────────── Payment methods ───────────────────────── */

/**
 * Classificação oficial do método de pagamento.
 * NU=Numerário, CC=Cartão de Crédito, CD=Multibanco, TB=Transferência Bancária,
 * DNP=Conta Corrente, CS=Compensação de Saldos, CH=Cheque, MBWAY, VENDUSPAY, ...
 */
export type PaymentMethodType =
  | "NU" | "CC" | "CD" | "CO" | "CS" | "DE" | "TR" | "MB" | "OU" | "CH"
  | "LC" | "TB" | "PR" | "DNP" | "MBWAY" | "ZARPH" | "ALICE" | "CASHMATIC"
  | "CASHLOGY" | "ITHINKIOT" | "MYPOS" | "TPASIBS" | "VENDUSPAY";

/** Método de pagamento configurado na conta Vendus (Dinheiro, Transferência, ...). */
export interface VendusPaymentMethod {
  id: number;
  title: string;
  type?: PaymentMethodType | string;
  status?: "on" | "off";
  change?: 0 | 1;
  order?: number;
  [key: string]: any;
}

export interface CreatePaymentMethodInput {
  title: string;
  type: PaymentMethodType;
  change?: 0 | 1;
  status?: "on" | "off";
}

/* ───────────────────────── Clients ───────────────────────── */

export type ClientStatus = "active" | "inactive";
/** Prazo de pagamento default. */
export type PayDue = "now" | "1" | "7" | "15" | "30" | "45" | "60" | "90";

export interface CreateClientInput {
  /** NIF — obrigatório (válido para clientes PT). */
  fiscal_id: string;
  name: string;
  /** ISO 3166-1 alpha-2 (ex.: "AO"). */
  country: string;
  address?: string;
  postalcode?: string;
  city?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  external_reference?: string;
  notes?: string;
  price_group_id?: number;
  send_email?: "yes" | "no";
  default_pay_due?: PayDue;
  irs_retention?: "yes" | "no";
}

/** Update parcial — todos os campos opcionais + status. */
export type UpdateClientInput = Partial<CreateClientInput> & { status?: ClientStatus };

export interface VendusClientRecord {
  id: number;
  fiscal_id: string;
  name: string;
  country: string;
  external_reference?: string;
  default_pay_due?: PayDue;
  address?: string;
  city?: string;
  postalcode?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  send_email?: "yes" | "no";
  irs_retention?: "yes" | "no";
  status?: ClientStatus;
  notes?: string;
  date?: string;
  price_group?: { id: number; title: string; is_default: "yes" | "no" };
  balance?: { total: number; on_time: number; overdue: number };
  [key: string]: any;
}

export interface ListClientsParams {
  q?: string;
  fiscal_id?: string;
  name?: string;
  email?: string;
  external_reference?: string;
  status?: ClientStatus;
  date?: string;
  page?: number;
  per_page?: number;
}

/* ───────────────────────── Products ───────────────────────── */

export type ProductStatus = "on" | "off";

export interface CreateProductInput {
  title: string;
  unit_id: number;
  reference?: string;
  barcode?: string;
  supplier_code?: string;
  description?: string;
  include_description?: "yes" | "no";
  supply_price?: number;
  gross_price?: number;
  type_id?: ItemTypeId;
  class_id?: string;
  lot_control?: boolean;
  stock_control?: 0 | 1;
  stock_type?: string;
  tax_id?: TaxId;
  tax_exemption?: string;
  tax_exemption_law?: string;
  category_id?: number;
  brand_id?: number;
  image?: string;
  status?: ProductStatus;
  prices?: { id: number; gross_price: number }[];
}

/** Update parcial — title/unit_id deixam de ser obrigatórios. */
export type UpdateProductInput = Partial<CreateProductInput>;

export interface VendusProduct {
  id: number;
  title: string;
  unit_id: number;
  reference?: string;
  barcode?: string;
  description?: string;
  supply_price?: number;
  gross_price?: number;
  price_without_tax?: number;
  type_id?: ItemTypeId;
  class_name?: string;
  tax_id?: TaxId;
  status?: ProductStatus;
  category_id?: number;
  brand_id?: number;
  stock?: number;
  variants?: any[];
  images?: string[];
  [key: string]: any;
}

export interface ListProductsParams {
  q?: string;
  ids?: string;
  title?: string;
  store_id?: number;
  reference?: string;
  barcode?: string;
  category_id?: number;
  brand_id?: number;
  status?: ProductStatus | "all";
  type?: "all" | "normal" | "compound" | "has_variants";
  page?: number;
  per_page?: number;
}
