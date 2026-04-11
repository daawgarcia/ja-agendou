CREATE DATABASE IF NOT EXISTS ja_agendou CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ja_agendou;

CREATE TABLE IF NOT EXISTS clinicas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  email VARCHAR(150) NULL,
  telefone VARCHAR(30) NULL,
  status ENUM('pendente', 'ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  licenca_dias INT UNSIGNED NULL,
  licenca_inicio_em DATETIME NULL,
  licenca_fim_em DATETIME NULL,
  trial_inicio_em DATETIME NULL,
  trial_fim_em DATETIME NULL,
  desbloqueado_em DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Compatibilidade para bases ja existentes.
ALTER TABLE clinicas
  MODIFY COLUMN status ENUM('pendente', 'ativo', 'inativo') NOT NULL DEFAULT 'ativo';

ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS trial_inicio_em DATETIME NULL AFTER status,
  ADD COLUMN IF NOT EXISTS trial_fim_em DATETIME NULL AFTER trial_inicio_em,
  ADD COLUMN IF NOT EXISTS desbloqueado_em DATETIME NULL AFTER trial_fim_em;

ALTER TABLE clinicas
  ADD COLUMN IF NOT EXISTS licenca_dias INT UNSIGNED NULL AFTER status,
  ADD COLUMN IF NOT EXISTS licenca_inicio_em DATETIME NULL AFTER licenca_dias,
  ADD COLUMN IF NOT EXISTS licenca_fim_em DATETIME NULL AFTER licenca_inicio_em;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('super_admin', 'admin', 'recepcao') NOT NULL DEFAULT 'recepcao',
  status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_usuarios_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pacientes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT UNSIGNED NOT NULL,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(30) NULL,
  email VARCHAR(150) NULL,
  data_nascimento DATE NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pacientes_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
  INDEX idx_pacientes_clinica_nome (clinica_id, nome)
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT UNSIGNED NOT NULL,
  paciente_id INT UNSIGNED NOT NULL,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  status ENUM('agendado', 'confirmado', 'concluido', 'cancelado') NOT NULL DEFAULT 'agendado',
  observacoes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_agendamentos_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
  CONSTRAINT fk_agendamentos_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
  INDEX idx_agendamentos_clinica_data (clinica_id, data, hora_inicio)
);

CREATE TABLE IF NOT EXISTS configuracoes_clinica (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT UNSIGNED NOT NULL,
  cor_primaria VARCHAR(20) NULL,
  cor_secundaria VARCHAR(20) NULL,
  logo_url VARCHAR(255) NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_configuracoes_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
);

INSERT INTO clinicas (id, nome, slug, email, telefone, status)
VALUES (1, 'Clínica Modelo', 'clinica-modelo', 'contato@clinicamodelo.com', '11999999999', 'ativo')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

INSERT INTO usuarios (clinica_id, nome, email, senha_hash, perfil, status)
SELECT 1, 'Administrador Geral', 'admin@jaagendou.app', '$2b$10$KIXIDZ8J0v7V3PqJdaRh0e14Bf6T4MHDL/95B2S/bRMyCV2wE8p8i', 'super_admin', 'ativo'
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'admin@jaagendou.app'
);

INSERT INTO pacientes (clinica_id, nome, telefone, email, data_nascimento, observacoes)
SELECT 1, 'Paciente Exemplo', '11988887777', 'paciente@exemplo.com', '1990-01-10', 'Primeiro cadastro de exemplo.'
WHERE NOT EXISTS (
  SELECT 1 FROM pacientes WHERE clinica_id = 1 AND nome = 'Paciente Exemplo'
);

INSERT INTO agendamentos (clinica_id, paciente_id, data, hora_inicio, hora_fim, status, observacoes)
SELECT 1, 1, CURDATE(), '14:00:00', '15:00:00', 'confirmado', 'Avaliação inicial.'
WHERE NOT EXISTS (
  SELECT 1 FROM agendamentos WHERE clinica_id = 1 AND paciente_id = 1 AND data = CURDATE() AND hora_inicio = '14:00:00'
);
