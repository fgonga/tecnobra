-- ============================================================
-- TECNOBRA — Sistema inteligente de gestão de obras
-- Esquema inicial da base de dados (MySQL 8, InnoDB, utf8mb4)
-- ============================================================

-- =========================
-- PLATAFORMA — utilizadores, perfis, configuração, notificações
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  username VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255) DEFAULT NULL,
  status TINYINT(1) DEFAULT 1,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recovery_codes (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(255) NOT NULL,
  token VARCHAR(255) DEFAULT NULL,
  used TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profile_rules (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id MEDIUMINT UNSIGNED NOT NULL,
  rule VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_profile_rule (profile_id, rule),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id MEDIUMINT UNSIGNED NOT NULL,
  profile_id MEDIUMINT UNSIGNED NOT NULL,
  UNIQUE KEY uq_user_profile (user_id, profile_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_rules (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id MEDIUMINT UNSIGNED NOT NULL,
  rule VARCHAR(100) NOT NULL,
  UNIQUE KEY uq_user_rule (user_id, rule),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuração global (linha única id=1), lida via ConfigCache
CREATE TABLE IF NOT EXISTS parametrization (
  id MEDIUMINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome_organizacao VARCHAR(150) NOT NULL DEFAULT 'Tecnobra',
  logo_url VARCHAR(255) NULL,
  events_dispatch_interval SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  message_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  alertas_ativos TINYINT(1) NOT NULL DEFAULT 1,
  alerta_ferramentas_hora VARCHAR(5) NOT NULL DEFAULT '18:30',
  stock_alerta_ativo TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  channel ENUM('sms','whatsapp','email') NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'pt',
  offset_days INT NULL,
  subject VARCHAR(255) NULL,
  body TEXT NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_tpl (event_type, channel, language, offset_days),
  INDEX idx_event (event_type, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sent_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NULL,
  channel ENUM('sms','whatsapp','email') NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  char_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  segments SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('sent','failed') NOT NULL DEFAULT 'sent',
  provider_message_id VARCHAR(64) NULL,
  error VARCHAR(255) NULL,
  order_code VARCHAR(40) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  INDEX idx_event (event_type),
  INDEX idx_channel (channel),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unique_code VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  status ENUM('pending','processing','processed','failed') NOT NULL DEFAULT 'pending',
  payload JSON NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 3,
  next_retry_at DATETIME NULL,
  last_error TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME NULL,
  INDEX idx_events_status_retry (status, next_retry_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_analyses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Análise',
  periods_config JSON NOT NULL,
  report_snapshots JSON NOT NULL,
  ai_analysis TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TECNOBRA — obras e empresas
-- =========================

CREATE TABLE IF NOT EXISTS obras (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  codigo VARCHAR(30) NOT NULL UNIQUE,
  endereco VARCHAR(255) NULL,
  cliente VARCHAR(150) NULL,
  estado ENUM('ativa','pausada','concluida') NOT NULL DEFAULT 'ativa',
  data_inicio DATE NULL,
  data_fim_prevista DATE NULL,
  responsavel_user_id MEDIUMINT UNSIGNED NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (responsavel_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS empresas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  nif VARCHAR(30) NULL,
  tipo ENUM('empreiteiro','subempreiteiro','fornecedor','fiscalizacao','outro') NOT NULL DEFAULT 'subempreiteiro',
  contacto_nome VARCHAR(150) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  estado ENUM('ativa','inativa') NOT NULL DEFAULT 'ativa',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TECNOBRA — trabalhadores, visitantes, veículos
-- =========================

CREATE TABLE IF NOT EXISTS trabalhadores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  empresa_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  funcao VARCHAR(100) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  documento VARCHAR(50) NULL,
  foto VARCHAR(255) NULL,
  qr_token CHAR(21) NOT NULL UNIQUE,
  cartao_estado ENUM('ativo','revogado') NOT NULL DEFAULT 'ativo',
  cartao_emitido_em DATETIME NULL,
  estado ENUM('ativo','suspenso','inativo') NOT NULL DEFAULT 'ativo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trab_obra (obra_id),
  INDEX idx_trab_empresa (empresa_id),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS visitantes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  empresa VARCHAR(150) NULL,
  motivo VARCHAR(255) NULL,
  telefone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  documento VARCHAR(50) NULL,
  anfitriao VARCHAR(150) NULL,
  qr_token CHAR(21) NOT NULL UNIQUE,
  valido_de DATETIME NULL,
  valido_ate DATETIME NULL,
  estado ENUM('previsto','ativo','encerrado') NOT NULL DEFAULT 'previsto',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_visit_obra (obra_id),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS veiculos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  matricula VARCHAR(20) NOT NULL,
  foto VARCHAR(255) NULL,
  marca_modelo VARCHAR(100) NULL,
  tipo ENUM('ligeiro','pesado','maquina','outro') NOT NULL DEFAULT 'ligeiro',
  proprietario_tipo ENUM('empresa','trabalhador','visitante','outro') NOT NULL DEFAULT 'outro',
  proprietario_nome VARCHAR(150) NULL,
  ocr_matricula VARCHAR(20) NULL,
  ocr_confianca DECIMAL(4,3) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_veic_obra_matricula (obra_id, matricula),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Movimentos de pessoas/veículos na portaria (entradas e saídas)
CREATE TABLE IF NOT EXISTS movimentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  tipo_entidade ENUM('trabalhador','visitante','veiculo') NOT NULL,
  trabalhador_id INT UNSIGNED NULL,
  visitante_id INT UNSIGNED NULL,
  veiculo_id INT UNSIGNED NULL,
  direcao ENUM('entrada','saida') NOT NULL,
  metodo ENUM('qr','manual','ocr') NOT NULL DEFAULT 'qr',
  portao VARCHAR(50) NULL,
  registado_por MEDIUMINT UNSIGNED NULL,
  ocorrido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mov_obra_data (obra_id, ocorrido_em),
  INDEX idx_mov_trab (trabalhador_id, ocorrido_em),
  INDEX idx_mov_visit (visitante_id, ocorrido_em),
  INDEX idx_mov_veic (veiculo_id, ocorrido_em),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (trabalhador_id) REFERENCES trabalhadores(id) ON DELETE SET NULL,
  FOREIGN KEY (visitante_id) REFERENCES visitantes(id) ON DELETE SET NULL,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
  FOREIGN KEY (registado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TECNOBRA — equipamentos e ferramentas
-- =========================

CREATE TABLE IF NOT EXISTS equipamentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  codigo VARCHAR(50) NULL,
  categoria ENUM('equipamento','ferramenta') NOT NULL DEFAULT 'ferramenta',
  numero_serie VARCHAR(100) NULL,
  qr_token CHAR(21) NOT NULL UNIQUE,
  estado ENUM('disponivel','em_uso','danificado','fora_servico','desaparecido') NOT NULL DEFAULT 'disponivel',
  trabalhador_atual_id INT UNSIGNED NULL,
  foto VARCHAR(255) NULL,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_equip_obra (obra_id),
  INDEX idx_equip_estado (obra_id, estado),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (trabalhador_atual_id) REFERENCES trabalhadores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentos_equipamento (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equipamento_id INT UNSIGNED NOT NULL,
  obra_id INT UNSIGNED NOT NULL,
  trabalhador_id INT UNSIGNED NOT NULL,
  tipo ENUM('levantamento','devolucao') NOT NULL,
  estado_devolucao ENUM('ok','danificado','desaparecido') NULL,
  devolucao_prevista DATETIME NULL,
  registado_por MEDIUMINT UNSIGNED NULL,
  ocorrido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_moveq_equip (equipamento_id, ocorrido_em),
  INDEX idx_moveq_obra (obra_id, tipo, ocorrido_em),
  INDEX idx_moveq_trab (trabalhador_id, ocorrido_em),
  FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE CASCADE,
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (trabalhador_id) REFERENCES trabalhadores(id) ON DELETE RESTRICT,
  FOREIGN KEY (registado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TECNOBRA — materiais, orçamentos, guias de remessa, consumos
-- =========================

CREATE TABLE IF NOT EXISTS materiais (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  unidade VARCHAR(20) NOT NULL DEFAULT 'un',
  categoria VARCHAR(50) NULL,
  stock_atual DECIMAL(12,3) NOT NULL DEFAULT 0,
  stock_minimo DECIMAL(12,3) NOT NULL DEFAULT 0,
  qr_token CHAR(21) NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mat_obra (obra_id),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orcamentos_materiais (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantidade_orcada DECIMAL(12,3) NOT NULL DEFAULT 0,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_orc_obra_material (obra_id, material_id),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guias_remessa (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  numero VARCHAR(50) NOT NULL,
  fornecedor_empresa_id INT UNSIGNED NULL,
  fornecedor_nome VARCHAR(150) NULL,
  data_entrega DATETIME NOT NULL,
  recebido_por MEDIUMINT UNSIGNED NULL,
  documento VARCHAR(255) NULL,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_guia_obra (obra_id, data_entrega),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (fornecedor_empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
  FOREIGN KEY (recebido_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guias_remessa_itens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  guia_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
  preco_unitario DECIMAL(12,2) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gitem_guia (guia_id),
  INDEX idx_gitem_material (material_id),
  FOREIGN KEY (guia_id) REFERENCES guias_remessa(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consumos_materiais (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  material_id INT UNSIGNED NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
  trabalhador_id INT UNSIGNED NULL,
  registado_por MEDIUMINT UNSIGNED NULL,
  ocorrido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cons_obra_mat (obra_id, material_id, ocorrido_em),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (material_id) REFERENCES materiais(id) ON DELETE RESTRICT,
  FOREIGN KEY (trabalhador_id) REFERENCES trabalhadores(id) ON DELETE SET NULL,
  FOREIGN KEY (registado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- TECNOBRA — desempenho e alertas
-- =========================

CREATE TABLE IF NOT EXISTS metricas_desempenho (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  unidade VARCHAR(20) NOT NULL DEFAULT 'un',
  descricao VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS desempenhos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  trabalhador_id INT UNSIGNED NOT NULL,
  metrica_id INT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
  registado_por MEDIUMINT UNSIGNED NULL,
  obs VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_des_obra_data (obra_id, data),
  INDEX idx_des_trab_data (trabalhador_id, data),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE RESTRICT,
  FOREIGN KEY (trabalhador_id) REFERENCES trabalhadores(id) ON DELETE CASCADE,
  FOREIGN KEY (metrica_id) REFERENCES metricas_desempenho(id) ON DELETE RESTRICT,
  FOREIGN KEY (registado_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alertas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  obra_id INT UNSIGNED NOT NULL,
  tipo ENUM('ferramenta_nao_devolvida','stock_baixo','visitante_nao_saiu','outro') NOT NULL DEFAULT 'outro',
  referencia_tipo VARCHAR(30) NULL,
  referencia_id INT UNSIGNED NULL,
  mensagem VARCHAR(500) NOT NULL,
  estado ENUM('aberto','resolvido') NOT NULL DEFAULT 'aberto',
  resolvido_por MEDIUMINT UNSIGNED NULL,
  resolvido_em DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_alerta_obra_estado (obra_id, estado),
  FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
  FOREIGN KEY (resolvido_por) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
