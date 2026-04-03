const env = require('./env');

module.exports = {
  enableV1Api: env.ENABLE_V1_API,
  enableLegacyApi: env.ENABLE_LEGACY_API,
  deprecationMinDays: env.DEPRECATION_MIN_DAYS,
  deprecationLegacyTrafficThreshold: env.DEPRECATION_LEGACY_TRAFFIC_THRESHOLD,
  deprecationStableDays: env.DEPRECATION_STABLE_DAYS
};
