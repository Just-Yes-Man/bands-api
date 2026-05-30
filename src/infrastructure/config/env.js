const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const asBool = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
};

const asNumber = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: asNumber(process.env.PORT, 1200),

  DATABASE_URL: process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST,
  PGPORT: asNumber(process.env.PGPORT, 5432),
  PGDATABASE: process.env.PGDATABASE,
  PGUSER: process.env.PGUSER,
  PGPASSWORD: process.env.PGPASSWORD,
  PGSSL: asBool(process.env.PGSSL, false),

  AUTO_MIGRATE: asBool(process.env.AUTO_MIGRATE, true),

  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_ISSUER: process.env.JWT_ISSUER || "conveyor-backend",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "conveyor-clients",
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: asNumber(
    process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    5,
  ),
  LOGIN_RATE_LIMIT_WINDOW_MS: asNumber(
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
    10 * 60 * 1000,
  ),
  ORDER_CRITICAL_RETRY_ATTEMPTS: asNumber(
    process.env.ORDER_CRITICAL_RETRY_ATTEMPTS,
    3,
  ),
  EMQX_ENABLED: asBool(process.env.EMQX_ENABLED, false),
  EMQX_URL: process.env.EMQX_URL || "mqtt://localhost:1883",
  EMQX_USERNAME: process.env.EMQX_USERNAME,
  EMQX_PASSWORD: process.env.EMQX_PASSWORD,
  EMQX_CLIENT_ID: process.env.EMQX_CLIENT_ID,
  EMQX_QOS: asNumber(process.env.EMQX_QOS, 1),
  EMQX_ORDERS_CREATE_TOPIC:
    process.env.EMQX_ORDERS_CREATE_TOPIC || "pedidos/creacion",
  EMQX_ORDERS_PROGRESS_TOPIC:
    process.env.EMQX_ORDERS_PROGRESS_TOPIC || "pedidos/avances",
  EMQX_MEASUREMENTS_TOPIC:
    process.env.EMQX_MEASUREMENTS_TOPIC || "productos/mediciones",
  EMQX_BAND_ALERTS_TOPIC:
    process.env.EMQX_BAND_ALERTS_TOPIC ||
    process.env.MQTT_TOPIC_BANDAS_ALERTAS ||
    "bandas/alertas",
  EMQX_BAND_ERROR_RESOLVE_TOPIC:
    process.env.EMQX_BAND_ERROR_RESOLVE_TOPIC ||
    process.env.MQTT_TOPIC_BANDAS_ERROR_RESOLVER ||
    "bandas/errores/resolver",

  MEASUREMENT_REALTIME_NAMESPACE:
    process.env.MEASUREMENT_REALTIME_NAMESPACE || "/realtime/v1",
  MEASUREMENT_CRITICAL_RETRY_ATTEMPTS: asNumber(
    process.env.MEASUREMENT_CRITICAL_RETRY_ATTEMPTS,
    3,
  ),
  MEASUREMENT_IDEMPOTENCY_MAX_LENGTH: asNumber(
    process.env.MEASUREMENT_IDEMPOTENCY_MAX_LENGTH,
    120,
  ),
  MEASUREMENT_IDEMPOTENCY_MIN_LENGTH: asNumber(
    process.env.MEASUREMENT_IDEMPOTENCY_MIN_LENGTH,
    6,
  ),
  MEASUREMENT_IDEMPOTENCY_PATTERN:
    process.env.MEASUREMENT_IDEMPOTENCY_PATTERN ||
    "^[a-zA-Z0-9][a-zA-Z0-9-]{5,119}$",

  ENABLE_V1_API: asBool(process.env.ENABLE_V1_API, true),
  ENABLE_LEGACY_API: asBool(process.env.ENABLE_LEGACY_API, true),
  DEPRECATION_MIN_DAYS: asNumber(process.env.DEPRECATION_MIN_DAYS, 30),
  DEPRECATION_LEGACY_TRAFFIC_THRESHOLD: asNumber(
    process.env.DEPRECATION_LEGACY_TRAFFIC_THRESHOLD,
    5,
  ),
  DEPRECATION_STABLE_DAYS: asNumber(process.env.DEPRECATION_STABLE_DAYS, 7),
};
