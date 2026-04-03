const bcrypt = require('bcryptjs');

const { ClientAuthService } = require('../../../src/application/services/client-auth-service');

describe('integration login auth service', () => {
  test('returns session token for valid credentials', async () => {
    const hash = await bcrypt.hash('password1', 10);

    const repo = {
      findByNombre: jest.fn().mockResolvedValue({
        id: 1,
        nombre: 'ana',
        contrasena: hash,
        activo: true
      })
    };

    const service = new ClientAuthService({
      clientRepository: repo,
      authAuditRepository: { record: jest.fn().mockResolvedValue() },
      loginRateLimitStore: {
        consume: jest.fn().mockReturnValue({ allowed: true }),
        reset: jest.fn()
      },
      clientJwtService: { issueToken: jest.fn().mockReturnValue('jwt-token') }
    });

    const session = await service.login({ nombre: 'ana', contrasena: 'password1', ip: '127.0.0.1' });
    expect(session.token).toBe('jwt-token');
    expect(session.expiresIn).toBe('1h');
  });

  test('returns generic auth failure for invalid credentials', async () => {
    const service = new ClientAuthService({
      clientRepository: { findByNombre: jest.fn().mockResolvedValue(null) },
      authAuditRepository: { record: jest.fn().mockResolvedValue() },
      loginRateLimitStore: {
        consume: jest.fn().mockReturnValue({ allowed: true }),
        reset: jest.fn()
      },
      clientJwtService: { issueToken: jest.fn() }
    });

    await expect(service.login({ nombre: 'ana', contrasena: 'bad', ip: '127.0.0.1' })).rejects.toMatchObject({
      code: 'AUTH_FAILED',
      statusCode: 401
    });
  });

  test('rejects when rate limit is exceeded', async () => {
    const service = new ClientAuthService({
      clientRepository: { findByNombre: jest.fn() },
      authAuditRepository: { record: jest.fn().mockResolvedValue() },
      loginRateLimitStore: {
        consume: jest.fn().mockReturnValue({ allowed: false }),
        reset: jest.fn()
      },
      clientJwtService: { issueToken: jest.fn() }
    });

    await expect(service.login({ nombre: 'ana', contrasena: 'password1', ip: '127.0.0.1' })).rejects.toMatchObject({
      code: 'AUTH_RATE_LIMITED',
      statusCode: 429
    });
  });
});
