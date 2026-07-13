-- =============================================
-- update14: entidade parametrizável da referência (Multicaixa)
-- =============================================

ALTER TABLE parametrization
  ADD COLUMN reference_entity VARCHAR(20) NOT NULL DEFAULT '' AFTER reference_expiration_minutes;
