async function hasIndex(pool, tableName, indexName) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?
     LIMIT 1`,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function addIndexIfMissing(pool, tableName, indexName, columns) {
  if (await hasIndex(pool, tableName, indexName)) return;
  await pool.execute(
    `ALTER TABLE ${tableName} ADD INDEX ${indexName} (${columns})`
  );
}

async function up({ pool }) {
  // Login: busca por email em usuarios
  await addIndexIfMissing(pool, 'usuarios', 'idx_usuarios_email', 'email');

  // Reset de senha: busca por token
  await addIndexIfMissing(pool, 'usuarios', 'idx_usuarios_reset_token', 'reset_password_token');

  // Busca de pacientes por email e telefone
  await addIndexIfMissing(pool, 'pacientes', 'idx_pacientes_email', 'email');
  await addIndexIfMissing(pool, 'pacientes', 'idx_pacientes_telefone', 'telefone');

  // Agendamentos por data (listagem e lembretes)
  await addIndexIfMissing(pool, 'agendamentos', 'idx_agendamentos_data', 'clinica_id, data');
}

module.exports = { up };
