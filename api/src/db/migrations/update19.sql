-- =============================================
-- update19: lembrete de expiração de referências
--   `reminded_at` — marca quando o cliente já foi avisado que a referência
--   vai expirar (guard anti-duplicado, análogo a orders.abandoned_notified_at).
--   Usado pela task schedules/tasks/referenceExpiryRemember.ts
-- =============================================

ALTER TABLE payments
  ADD COLUMN reminded_at DATETIME NULL AFTER expired_at;
