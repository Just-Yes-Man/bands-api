const bcrypt = require('bcryptjs');

const { ClientAuthService } = require('../../../src/application/services/client-auth-service');

describe('integration register auth service', () => {
  test('creates client when user does not exist', async () => {
    const repo = {
      findByNombre: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 1, nombre: 'ana', activo: true })
    };

    const audit = { record: jest.fn().mockResolvedValue() };
    const rateLimit = { consume: jest.fn(), reset: jest.fn() };
    const jwtSvc = { issueToken: jest.fn() };

    const service = new ClientAuthService({
      clientRepository: repo,
      authAuditRepository: audit,
      loginRateLimitStore: rateLimit,
      clientJwtService: jwtSvc
    });

    const created = await service.register({ nombre: 'ana', contrasena: 'password1', ip: '127.0.0.1' });

    expect(created.nombre).toBe('ana');
    expect(repo.create).toHaveBeenCalledTimes(1);
    const callArg = repo.create.mock.calls[0][0];
    expect(await bcrypt.compare('password1', callArg.contrasenaHash)).toBe(true);
  });

  test('rejects duplicate register', async () => {
    const repo = {
      findByNombre: jest.fn().mockResolvedValue({ id: 1, nombre: 'ana' }),
      create: jest.fn()
    };

    const audit = { record: jest.fn().mockResolvedValue() };

    const service = new ClientAuthService({
      clientRepository: repo,
      authAuditRepository: audit,
      loginRateLimitStore: { consume: jest.fn(), reset: jest.fn() },
      clientJwtService: { issueToken: jest.fn() }
    });

    await expect(service.register({ nombre: 'ana', contrasena: 'password1', ip: '127.0.0.1' })).rejects.toMatchObject({
      code: 'DUPLICATE_CLIENT',
      statusCode: 409
    });
  });
});
