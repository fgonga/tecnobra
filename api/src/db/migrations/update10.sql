-- =============================================
-- update10: coluna recovery_notified_at em orders
-- =============================================

ALTER TABLE orders
  ADD COLUMN recovery_notified_at DATETIME NULL DEFAULT NULL;
