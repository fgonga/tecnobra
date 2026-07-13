-- =============================================
-- update11: remover payment_max_retries de parametrization
-- =============================================

ALTER TABLE parametrization
  DROP COLUMN payment_max_retries;
