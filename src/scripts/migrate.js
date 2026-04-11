const { runMigrations } = require('../config/migrations');

async function main() {
  try {
    const result = await runMigrations();
    console.log(`Migrations concluídas. Executadas: ${result.executed}/${result.total}.`);
    process.exit(0);
  } catch (error) {
    console.error('Falha ao executar migrations:', error);
    process.exit(1);
  }
}

main();
