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
  // Agendamentos: JOINs em dentista_id e servico_id sem índice
  await addIndexIfMissing(pool, 'agendamentos', 'idx_agendamentos_dentista_id', 'dentista_id');
  await addIndexIfMissing(pool, 'agendamentos', 'idx_agendamentos_servico_id', 'servico_id');
  // Consultas por status dentro da clínica (filtragem no dashboard)
  await addIndexIfMissing(pool, 'agendamentos', 'idx_agendamentos_clinica_status', 'clinica_id, status');
  // Aniversariantes: MONTH(data_nascimento) — índice no campo direto ajuda o otimizador
  await addIndexIfMissing(pool, 'pacientes', 'idx_pacientes_clinica_nasc', 'clinica_id, data_nascimento');
}

module.exports = { up };
