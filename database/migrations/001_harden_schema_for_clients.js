const { hashPassword } = require('../../src/utils/hash');

async function hasColumn(pool, tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(pool, tableName, columnName, definitionSql) {
  if (await hasColumn(pool, tableName, columnName)) {
    return;
  }

  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
}

async function ensureClinicaBase(pool) {
  const [rows] = await pool.execute('SELECT id FROM clinicas ORDER BY id ASC LIMIT 1');
  if (rows.length) {
    return rows[0].id;
  }

  const [result] = await pool.execute(
    `INSERT INTO clinicas (nome, slug, email, telefone, status)
     VALUES (?, ?, ?, ?, 'ativo')`,
    ['Clinica Modelo', 'clinica-modelo', 'contato@clinicamodelo.com', '11999999999']
  );

  return result.insertId;
}

async function ensureSuperAdmin(pool, clinicaId, { nome, email, senha }) {
  const senhaHash = await hashPassword(senha);
  const [rows] = await pool.execute('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email]);

  if (!rows.length) {
    await pool.execute(
      `INSERT INTO usuarios
       (clinica_id, nome, email, senha_hash, perfil, status)
       VALUES (?, ?, ?, ?, 'super_admin', 'ativo')`,
      [clinicaId, nome, email, senhaHash]
    );
    return;
  }

  await pool.execute(
    `UPDATE usuarios
     SET clinica_id = ?,
         nome = ?,
         perfil = 'super_admin',
         status = 'ativo'
     WHERE email = ?`,
    [clinicaId, nome, email, email]
  );
}

module.exports = {
  async up({ pool }) {
    await pool.execute(
      `CREATE TABLE IF NOT EXISTS clinicas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        email VARCHAR(150) NULL,
        telefone VARCHAR(30) NULL,
        status ENUM('pendente', 'ativo', 'inativo') NOT NULL DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS usuarios (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT UNSIGNED NOT NULL,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        perfil ENUM('super_admin', 'admin', 'recepcao') NOT NULL DEFAULT 'recepcao',
        status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS pacientes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT UNSIGNED NOT NULL,
        nome VARCHAR(150) NOT NULL,
        telefone VARCHAR(30) NULL,
        email VARCHAR(150) NULL,
        data_nascimento DATE NULL,
        observacoes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_pacientes_clinica_nome (clinica_id, nome)
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS agendamentos (
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
        INDEX idx_agendamentos_clinica_data (clinica_id, data, hora_inicio)
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS dentistas (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT UNSIGNED NOT NULL,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(150) NULL,
        telefone VARCHAR(30) NULL,
        ativo TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_dentistas_clinica_nome (clinica_id, nome)
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS servicos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT UNSIGNED NOT NULL,
        nome VARCHAR(150) NOT NULL,
        valor DECIMAL(10,2) NOT NULL DEFAULT 0,
        ativo TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_servicos_clinica_nome (clinica_id, nome)
      )`
    );

    await pool.execute(
      `CREATE TABLE IF NOT EXISTS recibos (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT UNSIGNED NOT NULL,
        paciente_id INT UNSIGNED NULL,
        valor DECIMAL(10,2) NOT NULL DEFAULT 0,
        descricao VARCHAR(255) NULL,
        data_recibo DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_recibos_clinica_data (clinica_id, data_recibo)
      )`
    );

    await addColumnIfMissing(pool, 'clinicas', 'licenca_dias', 'INT UNSIGNED NULL AFTER status');
    await addColumnIfMissing(pool, 'clinicas', 'licenca_inicio_em', 'DATETIME NULL AFTER licenca_dias');
    await addColumnIfMissing(pool, 'clinicas', 'licenca_fim_em', 'DATETIME NULL AFTER licenca_inicio_em');
    await addColumnIfMissing(pool, 'clinicas', 'trial_inicio_em', 'DATETIME NULL AFTER licenca_fim_em');
    await addColumnIfMissing(pool, 'clinicas', 'trial_fim_em', 'DATETIME NULL AFTER trial_inicio_em');
    await addColumnIfMissing(pool, 'clinicas', 'desbloqueado_em', 'DATETIME NULL AFTER trial_fim_em');

    await addColumnIfMissing(pool, 'agendamentos', 'dentista_id', 'INT UNSIGNED NULL AFTER paciente_id');
    await addColumnIfMissing(pool, 'agendamentos', 'servico_id', 'INT UNSIGNED NULL AFTER dentista_id');
    await addColumnIfMissing(pool, 'agendamentos', 'procedimento', 'VARCHAR(150) NULL AFTER servico_id');
    await addColumnIfMissing(pool, 'agendamentos', 'valor_estimado', 'DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER observacoes');

    const clinicaId = await ensureClinicaBase(pool);

    await ensureSuperAdmin(pool, clinicaId, {
      nome: 'Administrador Geral',
      email: 'admin@jaagendou.app',
      senha: '123456',
    });

    await ensureSuperAdmin(pool, clinicaId, {
      nome: 'MESTRE',
      email: 'otavio@jaagendou.app',
      senha: 'Otavio2805@',
    });

    await pool.execute(
      `UPDATE clinicas
       SET status = 'ativo'
       WHERE id = ?`,
      [clinicaId]
    );
  },
};
