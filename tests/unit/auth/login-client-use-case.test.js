const { LoginClientUseCase } = require('../../../src/application/use-cases/login-client-use-case');

describe('login auth unit', () => {
  test('login use case delegates to service', async () => {
    const service = {
      login: jest.fn().mockResolvedValue({ token: 'jwt', tokenType: 'Bearer', expiresIn: '1h' })
    };

    const useCase = new LoginClientUseCase({ clientAuthService: service });
    const result = await useCase.execute({ nombre: 'ana', contrasena: 'password1' });

    expect(service.login).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ token: 'jwt', tokenType: 'Bearer', expiresIn: '1h' });
  });
});
