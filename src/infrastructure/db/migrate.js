const fs = require('fs/promises');
const path = require('path');

const env = require('../config/env');
const { logger } = require('../logging/logger');
const { pool } = require('./postgres');

const migrationsDir = path.join(__dirname, 'migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

const runMigrations = async () => {
  await ensureMigrationsTable();

  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1', [file]);
    if (applied.rowCount) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await pool.query('BEGIN');

    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations(name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      logger.info('migration.applied', { file });
    } catch (error) {
      await pool.query('ROLLBACK');
      logger.error('migration.failed', { file, message: error.message });
      throw error;
    }
  }
};

const run = async () => {
  if (!env.AUTO_MIGRATE) {
    logger.info('migration.skipped', { reason: 'AUTO_MIGRATE=false' });
    return;
  }

  await runMigrations();
};

if (require.main === module) {
  run()
    .then(() => pool.end())
    .catch(async (error) => {
      logger.error('migration.fatal', { message: error.message });
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  runMigrations: run
};
