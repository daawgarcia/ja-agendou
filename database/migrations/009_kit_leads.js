const pool = require('../../src/config/db');

async function up() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS kit_leads (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email       VARCHAR(255) NOT NULL,
      origem      VARCHAR(100) NOT NULL DEFAULT 'exit_popup',
      criado_em   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      digest_enviado TINYINT(1) NOT NULL DEFAULT 0,
      INDEX idx_criado_em (criado_em),
      INDEX idx_digest (digest_enviado)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

module.exports = { up };
