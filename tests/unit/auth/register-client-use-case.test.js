const { validatePasswordPolicy } = require('../../../src/domain/policies/client-password-policy');
const { RegisterClientUseCase } = require('../../../src/application/use-cases/register-client-use-case');

describe('register auth unit', () => {
  test('rejects password without number', () => {
    expect(validatePasswordPolicy('password').ok).toBe(false);
  });

  test('accepts password with min length and number', () => {
    expect(validatePasswordPolicy('password1').ok).toBe(true);
  });

  test('register use case delegates to service', async () => {
    const service = {
      register: jest.fn().mockResolvedValue({ id: 10, nombre: 'ana' })
    };

    const useCase = new RegisterClientUseCase({ clientAuthService: service });
    const result = await useCase.execute({ nombre: 'ana', contrasena: 'password1' });

    expect(service.register).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 10, nombre: 'ana' });
  });
});
