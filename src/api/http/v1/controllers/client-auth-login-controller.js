const { parseLoginPayload } = require('../../../../application/dto/client-login-dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asHttpError } = require('../../../../shared/errors/auth-errors');

const { loginClientUseCase } = buildContainer();

const loginClient = async (req, res) => {
  try {
    const payload = parseLoginPayload(req.body);
    const session = await loginClientUseCase.execute({
      ...payload,
      ip: req.ip
    });

    return res.status(200).json({
      ok: true,
      data: session
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

    if (error.code === 'AUTH_RATE_LIMITED') {
      return res.status(429).json({
        ok: false,
        error: {
          code: 'AUTH_RATE_LIMITED',
          message: 'Demasiados intentos, intenta mas tarde'
        }
      });
    }

    return res.status(401).json({
      ok: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Credenciales invalidas'
      }
    });
  }
};

module.exports = {
  loginClient
};
