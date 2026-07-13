-- =============================================
-- update18: coluna `reference` em payments
--   Identificador de quem pagou, pesquisável na listagem:
--     • ref/aref    -> número da referência Multicaixa (response.reference.referenceNumber)
--     • express     -> telefone que pagou (payments.phone)
-- =============================================

ALTER TABLE payments
  ADD COLUMN reference VARCHAR(32) NULL AFTER phone,
  ADD INDEX idx_reference (reference);

-- Backfill express: usa o telefone que pagou
UPDATE payments
   SET reference = phone
 WHERE payment_type IN ('express', 'aexpress')
   AND (reference IS NULL OR reference = '')
   AND phone IS NOT NULL AND phone <> '';

-- Backfill ref: extrai a referência do JSON guardado em response
UPDATE payments
   SET reference = JSON_UNQUOTE(JSON_EXTRACT(response, '$.reference.referenceNumber'))
 WHERE payment_type IN ('ref', 'aref')
   AND (reference IS NULL OR reference = '')
   AND JSON_EXTRACT(response, '$.reference.referenceNumber') IS NOT NULL;
