const flags = require('../../infrastructure/config/feature-flags');

const isRemovalAllowed = ({ coexistenceDays, legacyTrafficPercent, stableDays, hasP1P2Incidents }) => {
  return (
    coexistenceDays >= flags.deprecationMinDays &&
    legacyTrafficPercent < flags.deprecationLegacyTrafficThreshold &&
    stableDays >= flags.deprecationStableDays &&
    !hasP1P2Incidents
  );
};

module.exports = {
  isRemovalAllowed
};
