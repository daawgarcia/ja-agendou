async function up({ pool }) {
  const [cols] = await pool.execute(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'pacientes'
       AND COLUMN_NAME = 'cep'
     LIMIT 1`
  );

  if (!cols.length) {
    await pool.execute(
      `ALTER TABLE pacientes ADD COLUMN cep VARCHAR(9) NULL DEFAULT NULL AFTER endereco`
    );
  }
}

module.exports = { up };
