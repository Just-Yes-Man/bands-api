const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const asBool = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === 'true';
};

const asNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: asNumber(process.env.PORT, 1200),

  DATABASE_URL: process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST,
  PGPORT: asNumber(process.env.PGPORT, 5432),
  PGDATABASE: process.env.PGDATABASE,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGSSL: asBool(process.env.PGSSL, false),

  AUTO_MIGRATE: asBool(process.env.AUTO_MIGRATE, true),

  JWT_SECRET: process.env.JWT_SECRET || 'change-me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_ISSUER: process.env.JWT_ISSUER || 'conveyor-backend',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'conveyor-clients',
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: asNumber(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 5),
  LOGIN_RATE_LIMIT_WINDOW_MS: asNumber(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),

  ENABLE_V1_API: asBool(process.env.ENABLE_V1_API, true),
  ENABLE_LEGACY_API: asBool(process.env.ENABLE_LEGACY_API, true),
  DEPRECATION_MIN_DAYS: asNumber(process.env.DEPRECATION_MIN_DAYS, 30),
  DEPRECATION_LEGACY_TRAFFIC_THRESHOLD: asNumber(process.env.DEPRECATION_LEGACY_TRAFFIC_THRESHOLD, 5),
  DEPRECATION_STABLE_DAYS: asNumber(process.env.DEPRECATION_STABLE_DAYS, 7)
};
