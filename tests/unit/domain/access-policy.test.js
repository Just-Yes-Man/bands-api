const { can } = require('../../../src/domain/policies/access-policy');

describe('access policy', () => {
  test('admin can manage product models', () => {
    expect(can('admin', 'product-model:create')).toBe(true);
  });

  test('operator cannot manage product models', () => {
    expect(can('operator', 'product-model:create')).toBe(false);
  });
});
