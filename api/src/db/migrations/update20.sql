-- =============================================
-- update19: nível(is) CEFR alvo do curso
--   Usado para recomendar cursos no fim do teste de nível (separar A1, A2, ...).
--   JSON com um array de códigos CEFR, ex: ["A1","A2"]. NULL = curso geral
--   (aparece em todos os níveis).
-- =============================================

ALTER TABLE courses
  ADD COLUMN cefr_levels JSON DEFAULT NULL AFTER levels;
