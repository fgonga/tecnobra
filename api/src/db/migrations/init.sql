-- =========================
-- Tabela cursos Thinkific
-- =========================
CREATE TABLE IF NOT EXISTS courses (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  course_card_image_url VARCHAR(255) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  product_id VARCHAR(255) DEFAULT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  thinkific_id VARCHAR(50) NOT NULL UNIQUE,
  thinkific_type VARCHAR(50) NOT NULL DEFAULT 'course',
  price DECIMAL(10,2) NOT NULL DEFAULT 00.00,
  levels JSON DEFAULT NULL,
  days_until_expiry SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  INDEX idx_slug (slug),
  INDEX idx_thinkific_id (thinkific_id)
);

CREATE TABLE IF NOT EXISTS course_relations (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id MEDIUMINT UNSIGNED NOT NULL,
  related_course_id MEDIUMINT UNSIGNED NOT NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (related_course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id),
  INDEX idx_related_course (related_course_id)
);
-- =========================
-- TABELA DE RECUPERAÇÃO DE CÓDIGOS
-- =========================
CREATE TABLE IF NOT EXISTS recovery_codes (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(255) NOT NULL,
  token VARCHAR(255) DEFAULT NULL,
  used TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  INDEX idx_phone (phone)
);

-- =========================
-- TABELA DE USUÁRIOS
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  status TINYINT(1) DEFAULT 1,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'user'
);

-- =========================
-- TABELA DE CUPONS
-- =========================
CREATE TABLE IF NOT EXISTS coupons (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  code VARCHAR(100) UNIQUE NOT NULL,
  active TINYINT(1) DEFAULT 0,
  amount DECIMAL(10,2) DEFAULT 0.00,
  percentage DECIMAL(5,2) DEFAULT 0.00,
  expire_at DATETIME DEFAULT NULL
);
-- =========================
-- TABELA DE PROMOÇÕES
-- =========================
CREATE TABLE IF NOT EXISTS parametrization (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  promotion_active TINYINT(1) DEFAULT 0,
  promotion_quantity TINYINT UNSIGNED NOT NULL DEFAULT 0,
  promotion_quantity_max TINYINT UNSIGNED NOT NULL DEFAULT 0
);
-- =========================
-- TABELA DE PEDIDOS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('pending', 'completed', 'canceled') NOT NULL DEFAULT 'pending',

  amount_due DECIMAL(10,2) NOT NULL,
  discount_promotion DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_coupon DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  coupon_id MEDIUMINT UNSIGNED NULL,
  course_id MEDIUMINT UNSIGNED NULL,

  pending_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  canceled_at DATETIME NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_orders_status ON orders(status);

-- =========================
-- TABELA DE CLIENTES POR PEDIDO
-- =========================
CREATE TABLE IF NOT EXISTS order_customers (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id MEDIUMINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  thinkific_user_id VARCHAR(36),
  thinkific_enrollment_id VARCHAR(36),
  status ENUM('pending','completed','canceled') DEFAULT 'pending',
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_order_customers_status ON order_customers(status);


-- =========================
-- TABELA DE PAGAMENTOS
-- =========================
CREATE TABLE IF NOT EXISTS payments (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id MEDIUMINT UNSIGNED NOT NULL,
  cupom_id MEDIUMINT UNSIGNED NULL,
  code VARCHAR(15) NOT NULL UNIQUE,
  response JSON,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_at DATETIME,
  failed_at DATETIME,
  paid_at DATETIME,
  expired_at DATETIME,
  is_paid TINYINT(1) DEFAULT 0,
  phone VARCHAR(20),
  status ENUM('pending','failed','paid') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(cupom_id) REFERENCES coupons(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_code ON payments(code);
CREATE INDEX idx_payments_order_status ON payments(order_id, status);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);