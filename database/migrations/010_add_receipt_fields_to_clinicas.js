/**
 * Migration 010: Add receipt fields to clinicas table
 * responsavel_nome, responsavel_cpf, cidade
 */
module.exports = {
  async up({ pool }) {
    const columns = [
      { name: 'responsavel_nome', def: 'VARCHAR(150) NULL DEFAULT NULL' },
      { name: 'responsavel_cpf', def: 'VARCHAR(20) NULL DEFAULT NULL' },
      { name: 'cidade', def: 'VARCHAR(100) NULL DEFAULT NULL' },
    ];
    for (const col of columns) {
      const [rows] = await pool.execute(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinicas' AND COLUMN_NAME = ?`,
        [col.name]
      );
      if (!rows.length) {
        await pool.execute(`ALTER TABLE clinicas ADD COLUMN ${col.name} ${col.def}`);
        console.log(`  ✔ clinicas.${col.name} added`);
      }
    }
  },
};
