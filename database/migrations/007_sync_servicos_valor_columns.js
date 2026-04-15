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
  // Some databases have 'valor', others have 'valor_padrao'. Ensure both exist.
  const hasValor = await hasColumn(pool, 'servicos', 'valor');
  const hasValorPadrao = await hasColumn(pool, 'servicos', 'valor_padrao');

  if (!hasValor && hasValorPadrao) {
    // Production has valor_padrao — add 'valor' as copy
    await pool.execute(
      `ALTER TABLE servicos ADD COLUMN valor DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER nome`
    );
    await pool.execute(`UPDATE servicos SET valor = valor_padrao WHERE valor = 0 AND valor_padrao > 0`);
  } else if (hasValor && !hasValorPadrao) {
    // Schema has valor — add 'valor_padrao' as copy
    await pool.execute(
      `ALTER TABLE servicos ADD COLUMN valor_padrao DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER valor`
    );
    await pool.execute(`UPDATE servicos SET valor_padrao = valor WHERE valor_padrao = 0 AND valor > 0`);
  }
  // If both exist or neither, nothing to do
}

module.exports = { up };
