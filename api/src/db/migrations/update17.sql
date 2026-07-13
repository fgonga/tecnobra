-- =============================================
-- update17: Faturação eletrónica (Cegid Vendus)
--   - tabela invoices (1 encomenda -> N documentos: FR, NC, ...)
--   - orders.invoice_id (ponteiro para o documento principal/ativo)
--   - courses.vendus_product_id (liga curso a produto do Vendus)
--   - settings fiscais em parametrization (id=1)
-- =============================================

-- Documentos faturados (emitidos por nós ou conectados a docs já existentes no provider)
CREATE TABLE IF NOT EXISTS invoices (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id MEDIUMINT UNSIGNED NOT NULL,
  provider VARCHAR(20) NOT NULL DEFAULT 'vendus',     -- vendus | manual | other
  external_id VARCHAR(64) NULL,                        -- id do documento no Vendus/outro software
  type VARCHAR(10) NOT NULL DEFAULT 'FR',              -- FR, FT, NC, RG, ...
  number VARCHAR(60) NULL,                             -- ex: "FR 01P2026/0118"
  atcud VARCHAR(60) NULL,
  hash VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(10) NOT NULL DEFAULT 'N',             -- N (normal) | A (anulado) | F
  mode VARCHAR(10) NOT NULL DEFAULT 'normal',          -- tests | normal
  pdf_url VARCHAR(512) NULL,
  external_reference VARCHAR(64) NULL,                 -- normalmente o order.code
  connected TINYINT(1) NOT NULL DEFAULT 0,             -- 1 = ligado a doc já existente (não emitido por nós)
  created_by INT UNSIGNED NULL,                        -- user que emitiu/conectou
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoices_order (order_id),
  INDEX idx_invoices_external (provider, external_id),
  INDEX idx_invoices_status (status),
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ponteiro direto na encomenda para o documento fiscal principal (Vendus ou outro software)
ALTER TABLE orders
  ADD COLUMN invoice_id INT UNSIGNED NULL AFTER status,
  ADD CONSTRAINT fk_orders_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- Liga um curso a um produto do catálogo Vendus (não reutilizar product_id, que é do Thinkific)
ALTER TABLE courses
  ADD COLUMN vendus_product_id   VARCHAR(64)  DEFAULT NULL,
  ADD COLUMN vendus_product_name VARCHAR(150) DEFAULT NULL;

-- Configurações fiscais (linha única id=1), lidas via ConfigCache.
-- A identidade do emitente (razão social/NIF), série e numeração vivem na conta Vendus.
ALTER TABLE parametrization
  ADD COLUMN invoice_default_type    VARCHAR(10)  NOT NULL DEFAULT 'FR'        AFTER message_cost,
  ADD COLUMN invoice_mode            VARCHAR(10)  NOT NULL DEFAULT 'normal'    AFTER invoice_default_type,
  ADD COLUMN invoice_tax_id          VARCHAR(10)  NOT NULL DEFAULT 'NOR'       AFTER invoice_mode,
  ADD COLUMN invoice_tax_exemption   VARCHAR(20)  NULL                         AFTER invoice_tax_id,
  ADD COLUMN invoice_auto_send_email TINYINT(1)   NOT NULL DEFAULT 0           AFTER invoice_tax_exemption;

UPDATE parametrization
  SET invoice_default_type    = 'FR',
      invoice_mode            = 'normal',
      invoice_tax_id          = 'NOR',
      invoice_auto_send_email = 0
  WHERE id = 1;

-- Mapeia o método de pagamento local (AppyPay) -> método de pagamento do Vendus.
-- Necessário para documentos pagos no ato (FR/RG/FS), que exigem `payments[]`.
CREATE TABLE IF NOT EXISTS payment_method_maps (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  local_key   VARCHAR(20)  NOT NULL UNIQUE,   -- ref, aref, express, aexpress, qr
  label       VARCHAR(60)  NOT NULL,
  vendus_id   VARCHAR(64)  NULL,              -- id do método na conta Vendus
  vendus_name VARCHAR(150) NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO payment_method_maps (local_key, label) VALUES
  ('express',  'Multicaixa Express'),
  ('aexpress', 'Multicaixa Express (App)'),
  ('ref',      'Referência'),
  ('aref',     'Referência (App)'),
  ('qr',       'QR Code');
