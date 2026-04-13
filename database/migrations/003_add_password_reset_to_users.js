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

module.exports = {
  async up({ pool }) {
    await addColumnIfMissing(pool, 'usuarios', 'reset_password_token', 'VARCHAR(128) NULL AFTER senha_hash');
    await addColumnIfMissing(pool, 'usuarios', 'reset_password_expiry', 'DATETIME NULL AFTER reset_password_token');
  },
};