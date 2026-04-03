const { isRemovalAllowed } = require('../../../src/application/services/deprecation-policy.service');

describe('integration deprecation gates', () => {
  test('allows removal only when policy thresholds are satisfied', () => {
    const result = isRemovalAllowed({
      coexistenceDays: 30,
      legacyTrafficPercent: 4,
      stableDays: 7,
      hasP1P2Incidents: false
    });

    expect(result).toBe(true);
  });
});
