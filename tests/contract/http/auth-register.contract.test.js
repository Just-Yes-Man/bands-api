const { registerSchema } = require('../../../src/shared/contracts/client-auth-schemas');

describe('contract auth register', () => {
  test('accepts valid register payload shape', () => {
    const result = registerSchema.safeParse({ nombre: 'ana', contrasena: 'password1' });
    expect(result.success).toBe(true);
  });

  test('rejects weak password payload', () => {
    const result = registerSchema.safeParse({ nombre: 'ana', contrasena: 'weak' });
    expect(result.success).toBe(false);
  });
});
