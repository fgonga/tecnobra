-- =============================================
-- update15: contabilização de mensagens (SMS) + custo por mensagem
-- =============================================

-- Custo por mensagem (segmento de 161 chars) — parametrizável
ALTER TABLE parametrization
  ADD COLUMN message_cost DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER reference_entity;

-- Registo de cada mensagem enviada, com segmentos e custo congelado no envio
CREATE TABLE IF NOT EXISTS sent_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NULL,                   -- null em envios crus (recovery manual)
  channel ENUM('sms','whatsapp') NOT NULL,
  recipient VARCHAR(30) NOT NULL,
  body TEXT NOT NULL,
  char_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  segments SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,     -- custo/segmento no momento do envio
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,    -- segments * unit_cost (0 se falhou)
  status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  provider_message_id VARCHAR(64) NULL,
  error VARCHAR(255) NULL,
  order_code VARCHAR(40) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_event (event_type),
  INDEX idx_channel (channel),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
