-- =============================================
-- update13: templates de notificação (SMS / WhatsApp)
-- =============================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  channel ENUM('sms','whatsapp') NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'pt',
  offset_days INT NULL,
  body TEXT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tpl (event_type, channel, language, offset_days),
  INDEX idx_event (event_type, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Os defaults (mensagens por evento×canal) são inseridos pelo seed do
-- artisan/script de migração a partir de NotificationTemplateDefaults.ts
-- (corpos com apóstrofos/quebras de linha → inserção parametrizada).
