-- =============================================
-- update16: estado intermediário "paid" (Paga) para encomendas
-- Fluxo: pending -> paid (pago, processamento/matrícula pendente) -> completed (finalizada)
-- =============================================

-- Adiciona 'paid' ao ENUM de status das encomendas
ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending','paid','completed','canceled','refunded') NOT NULL DEFAULT 'pending';

-- Momento em que o pagamento foi confirmado (entrada no estado "paid")
ALTER TABLE orders
  ADD COLUMN paid_at DATETIME NULL AFTER pending_at;
