const { parseRegisterPayload } = require('../../../../application/dto/client-register-dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asHttpError } = require('../../../../shared/errors/auth-errors');

const { registerClientUseCase } = buildContainer();

const registerClient = async (req, res) => {
  try {
    const payload = parseRegisterPayload(req.body);
    const created = await registerClientUseCase.execute({
      ...payload,
      ip: req.ip
    });

    return res.status(201).json({
      ok: true,
      data: {
        id: created.id,
        nombre: created.nombre
      }
    });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const validationError = asHttpError('VALIDATION_ERROR', error.details);
      return res.status(validationError.statusCode).json({
        ok: false,
        error: {
          code: validationError.code,
          message: validationError.message,
          details: validationError.details
        }
      });
    }

    const authError = error.statusCode ? error : asHttpError('AUTH_FAILED');
    return res.status(authError.statusCode || 500).json({
      ok: false,
      error: {
        code: authError.code || 'INTERNAL_ERROR',
        message: authError.message || 'Error de autenticacion'
      }
    });
  }
};

module.exports = {
  registerClient
};
