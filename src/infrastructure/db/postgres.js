const { Pool } = require('pg');
const env = require('../config/env');

const hasDiscreteConfig = env.PGHOST && env.PGDATABASE && env.PGUSER;

if (!env.DATABASE_URL && !hasDiscreteConfig) {
  throw new Error('Configura DATABASE_URL o las variables PGHOST, PGDATABASE y PGUSER.');
}

const getSSLConfig = () => {
  if (!env.PGSSL) {
    return false;
  }
  return { rejectUnauthorized: false };
};

const normalizeConnectionString = (rawUrl) => {
  const parsed = new URL(rawUrl);
  if (env.PGSSL && parsed.searchParams.get('sslmode') === 'require') {
    parsed.searchParams.set('sslmode', 'no-verify');
  } else if (!env.PGSSL && parsed.searchParams.has('sslmode')) {
    parsed.searchParams.delete('sslmode');
  }
  return parsed.toString();
};

const pool = hasDiscreteConfig
  ? new Pool({
      host: env.PGHOST,
      port: env.PGPORT,
      database: env.PGDATABASE,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      ssl: getSSLConfig()
    })
  : new Pool({
      connectionString: normalizeConnectionString(env.DATABASE_URL),
      ssl: getSSLConfig()
    });

pool.on('error', (error) => {
  console.error('postgres.pool.error', error.message);
});

module.exports = {
  pool
};
