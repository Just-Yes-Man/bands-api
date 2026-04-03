const { loginSchema } = require('../../../src/shared/contracts/client-auth-schemas');

describe('contract auth login', () => {
  test('accepts login payload shape', () => {
    const result = loginSchema.safeParse({ nombre: 'ana', contrasena: 'password1' });
    expect(result.success).toBe(true);
  });

  test('rejects empty password', () => {
    const result = loginSchema.safeParse({ nombre: 'ana', contrasena: '' });
    expect(result.success).toBe(false);
  });
});
