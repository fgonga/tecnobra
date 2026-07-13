-- =============================================
-- update9: parametrization, events e influencers
-- =============================================

-- 1. Novos campos de parametrização
ALTER TABLE parametrization
  ADD COLUMN payment_max_retries      TINYINT UNSIGNED  NOT NULL DEFAULT 2,
  ADD COLUMN events_dispatch_interval SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  ADD COLUMN settlement_day_1         TINYINT UNSIGNED  NOT NULL DEFAULT 6,
  ADD COLUMN settlement_day_2         TINYINT UNSIGNED  NOT NULL DEFAULT 20,
  ADD COLUMN default_min_payout_kz    DECIMAL(15,2)     NOT NULL DEFAULT 10000.00,
  ADD COLUMN auto_settlements_enabled BOOLEAN           NOT NULL DEFAULT TRUE;

UPDATE parametrization
  SET payment_max_retries      = 2,
      events_dispatch_interval = 60,
      settlement_day_1         = 6,
      settlement_day_2         = 20,
      default_min_payout_kz    = 10000.00,
      auto_settlements_enabled = TRUE
  WHERE id = 1;

-- 2. Tipos de eventos
ALTER TABLE events
  MODIFY COLUMN type ENUM(
    'payment_success',
    'payment_refund',
    'course_update',
    'settlement_paid',
    'settlement_created',
    'settlement_cancelled',
    'settlement_proof_updated',
    'influencer_sync',
    'coupon_updated'
  ) NOT NULL;

-- 3. Novos campos de conta bancária / mínimo por influencer
ALTER TABLE influencers
  ADD COLUMN min_payout_kz       DECIMAL(15,2) NULL DEFAULT NULL,
  ADD COLUMN bank_name           VARCHAR(100)  NULL DEFAULT NULL,
  ADD COLUMN bank_account_name   VARCHAR(200)  NULL DEFAULT NULL,
  ADD COLUMN bank_account_number VARCHAR(100)  NULL DEFAULT NULL;
