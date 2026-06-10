const { Pool } = require('pg');
const env = require('../config/env');

const hasDiscreteConfig = env.PGHOST && env.PGDATABASE && env.PGUSER;
const hasConnectionString = Boolean(env.DATABASE_URL);

if (!hasConnectionString && !hasDiscreteConfig) {
  throw new Error('Configura DATABASE_URL o las variables PGHOST, PGDATABASE y PGUSER.');
}

const getSSLConfig = (requiresSsl = false) => {
  if (!env.PGSSL && !requiresSsl) {
    return false;
  }
  return { rejectUnauthorized: false };
};

const normalizeConnectionString = (rawUrl) => {
  const parsed = new URL(rawUrl);
  if (parsed.searchParams.get('sslmode') === 'require') {
    parsed.searchParams.set('sslmode', 'no-verify');
  }
  return parsed.toString();
};

const connectionStringRequiresSsl = hasConnectionString
  ? new URL(env.DATABASE_URL).searchParams.get('sslmode') === 'require'
  : false;

const pool = hasConnectionString
  ? new Pool({
      connectionString: normalizeConnectionString(env.DATABASE_URL),
      ssl: getSSLConfig(connectionStringRequiresSsl)
    })
  : new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      database: env.PGDATABASE,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      ssl: getSSLConfig()
    });

pool.on('error', (error) => {
  console.error('postgres.pool.error', error.message);
});

module.exports = {
  pool
};
