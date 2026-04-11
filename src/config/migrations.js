const fs = require('fs');
const path = require('path');

const pool = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

async function ensureMigrationsTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((fileName) => fileName.endsWith('.js'))
    .sort();
}

async function getAppliedMigrationNames() {
  const [rows] = await pool.execute('SELECT name FROM schema_migrations ORDER BY name ASC');
  return new Set(rows.map((row) => row.name));
}

async function markMigrationAsApplied(name) {
  await pool.execute('INSERT INTO schema_migrations (name) VALUES (?)', [name]);
}

async function runMigrations() {
  await ensureMigrationsTable();

  const migrationFiles = listMigrationFiles();
  if (!migrationFiles.length) {
    return { executed: 0, total: 0 };
  }

  const applied = await getAppliedMigrationNames();
  let executed = 0;

  for (const fileName of migrationFiles) {
    if (applied.has(fileName)) {
      continue;
    }

    const migrationPath = path.join(MIGRATIONS_DIR, fileName);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const migration = require(migrationPath);

    if (!migration || typeof migration.up !== 'function') {
      throw new Error(`Migration ${fileName} is invalid. It must export an async up function.`);
    }

    await migration.up({ pool });
    await markMigrationAsApplied(fileName);
    executed += 1;
  }

  return { executed, total: migrationFiles.length };
}

module.exports = {
  runMigrations,
};
