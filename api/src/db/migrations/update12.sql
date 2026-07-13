-- =============================================
-- update12: gateway de pagamento em parametrization
-- =============================================

ALTER TABLE parametrization
  ADD COLUMN default_payment_method       VARCHAR(20)       NOT NULL DEFAULT 'express',
  ADD COLUMN express_enabled              TINYINT(1)        NOT NULL DEFAULT 1,
  ADD COLUMN ref_enabled                  TINYINT(1)        NOT NULL DEFAULT 1,
  ADD COLUMN qr_enabled                   TINYINT(1)        NOT NULL DEFAULT 1,
  ADD COLUMN reference_expiration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 1440;

UPDATE parametrization
  SET default_payment_method       = 'express',
      express_enabled              = 1,
      ref_enabled                  = 1,
      qr_enabled                   = 1,
      reference_expiration_minutes = 1440
  WHERE id = 1;
