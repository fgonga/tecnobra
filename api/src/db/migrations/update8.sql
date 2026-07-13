-- =============================================
-- update8: refunds, settlements, wallet, perfis, parametrization
-- (unificação de update8-update21)
-- =============================================

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id MEDIUMINT UNSIGNED NOT NULL,
  payment_id MEDIUMINT UNSIGNED NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  requested_by VARCHAR(100) NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  notes TEXT NULL,
  approved_by VARCHAR(100) NULL,
  processed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refund_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- Expandir status de orders e payments para incluir refunded
ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'completed', 'canceled', 'refunded') NOT NULL DEFAULT 'pending';
ALTER TABLE payments MODIFY COLUMN status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending';

-- Settlements
CREATE TABLE IF NOT EXISTS settlements (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('influencer', 'general') DEFAULT 'general',
  influencer_id MEDIUMINT UNSIGNED NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_fees DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_commissions DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_refunds_count INT NOT NULL DEFAULT 0,
  total_refunds_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  net_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'paid') DEFAULT 'pending',
  reference VARCHAR(255) NULL,
  proof_urls JSON NULL,
  notes TEXT NULL,
  paid_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settlement_influencer FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE SET NULL
);

-- Wallet global (KPI cards)
CREATE TABLE IF NOT EXISTS wallet (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_in DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_out DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_settlements_out DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_refunds_out DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

INSERT INTO wallet (id, balance, total_in, total_out, total_settlements_out, total_refunds_out) VALUES (1, 0, 0, 0, 0, 0);

-- Wallet Transactions (log imutável)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('payment_in','settlement_out','refund_out','manual_in','manual_out','transfer_in','transfer_out') NOT NULL,
  account VARCHAR(20) NULL DEFAULT NULL,
  influencer_id MEDIUMINT UNSIGNED NULL,
  reference_type ENUM('payment','settlement','refund') NULL DEFAULT NULL,
  reference_id INT UNSIGNED NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_after DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_wt_influencer FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE SET NULL
);

-- Wallet Accounts (multi-conta)
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name ENUM('clients','treesix','partners','commissions','settled') NOT NULL,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO wallet_accounts (name, balance) VALUES
  ('clients',     0),
  ('treesix',     0),
  ('partners',    0),
  ('commissions', 0),
  ('settled',     0);

-- Perfis e permissões
CREATE TABLE IF NOT EXISTS profiles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_rules (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id MEDIUMINT UNSIGNED NOT NULL,
  rule VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_profile_rule (profile_id, rule),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id MEDIUMINT UNSIGNED NOT NULL,
  profile_id MEDIUMINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_user_profile (user_id, profile_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_rules (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id MEDIUMINT UNSIGNED NOT NULL,
  rule VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_user_rule (user_id, rule),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO profiles (name, description) VALUES
  ('Superadmin',    'Acesso total ao sistema'),
  ('Administrador', 'Gestão geral do sistema'),
  ('Contador',      'Acesso financeiro e relatórios'),
  ('Suporte',       'Apoio técnico'),
  ('Utilizador',    'Acesso básico ao sistema');

INSERT INTO profile_rules (profile_id, rule)
  SELECT id, '*' FROM profiles WHERE name = 'Superadmin';

INSERT INTO profile_rules (profile_id, rule)
  SELECT p.id, r.rule FROM profiles p
  CROSS JOIN (
    SELECT 'dashboard' AS rule UNION ALL SELECT 'orders'       UNION ALL SELECT 'payments'
    UNION ALL SELECT 'courses'  UNION ALL SELECT 'coupons'     UNION ALL SELECT 'users'
    UNION ALL SELECT 'reports'  UNION ALL SELECT 'helpers'     UNION ALL SELECT 'configs'
    UNION ALL SELECT 'influencers'
  ) r
  WHERE p.name = 'Administrador';

INSERT INTO profile_rules (profile_id, rule)
  SELECT p.id, r.rule FROM profiles p
  CROSS JOIN (
    SELECT 'dashboard' AS rule UNION ALL SELECT 'orders' UNION ALL SELECT 'payments'
    UNION ALL SELECT 'courses' UNION ALL SELECT 'reports'
  ) r
  WHERE p.name = 'Contador';

INSERT INTO profile_rules (profile_id, rule)
  SELECT p.id, r.rule FROM profiles p
  CROSS JOIN (SELECT 'dashboard' AS rule UNION ALL SELECT 'helpers') r
  WHERE p.name = 'Suporte';

INSERT INTO profile_rules (profile_id, rule)
  SELECT p.id, r.rule FROM profiles p
  CROSS JOIN (
    SELECT 'dashboard' AS rule UNION ALL SELECT 'orders'
    UNION ALL SELECT 'payments' UNION ALL SELECT 'helpers'
  ) r
  WHERE p.name = 'Utilizador';

INSERT IGNORE INTO user_profiles (user_id, profile_id)
  SELECT u.id, p.id
  FROM users u
  JOIN profiles p ON (
    (u.role = 'superadmin' AND p.name = 'Superadmin')    OR
    (u.role = 'admin'      AND p.name = 'Administrador') OR
    (u.role = 'account'    AND p.name = 'Contador')      OR
    (u.role = 'helper'     AND p.name = 'Suporte')       OR
    (u.role = 'user'       AND p.name = 'Utilizador')
  );

-- Parametrization extras
ALTER TABLE parametrization
  ADD COLUMN platform_fee_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0200,
  ADD COLUMN default_course_id MEDIUMINT UNSIGNED NULL,
  ADD CONSTRAINT fk_param_default_course
    FOREIGN KEY (default_course_id) REFERENCES courses(id) ON DELETE SET NULL;

-- Saved Analyses
CREATE TABLE saved_analyses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Análise',
  periods_config JSON NOT NULL,
  report_snapshots JSON NOT NULL,
  ai_analysis TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
