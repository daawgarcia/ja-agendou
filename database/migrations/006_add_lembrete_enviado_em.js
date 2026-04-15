async function hasColumn(pool, tableName, columnName) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function up({ pool }) {
  if (!(await hasColumn(pool, 'agendamentos', 'lembrete_enviado_em'))) {
    await pool.execute(
      `ALTER TABLE agendamentos ADD COLUMN lembrete_enviado_em DATETIME NULL DEFAULT NULL`
    );
  }
}

module.exports = { up };
