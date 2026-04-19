const { parseCreateMeasurementProcessPayload } = require('../../../../application/dto/measurement-process.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asMeasurementError } = require('../../../../shared/errors/measurement-errors');

const { createMeasurementProcessUseCase } = buildContainer();

const createMeasurementProcessController = async (req, res) => {
  try {
    const payload = parseCreateMeasurementProcessPayload(req.body);
    const data = await createMeasurementProcessUseCase.execute({
      orderId: Number(req.params.orderId),
      ...payload,
      actor: req.user,
      io: req.app.get('io')
    });

    return res.status(201).json({ ok: true, data });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const e = asMeasurementError('MEASUREMENT_VALIDATION_ERROR', error.details);
      return res.status(e.statusCode).json({ ok: false, error: { code: e.code, message: e.message, details: e.details } });
    }

    return res.status(error.statusCode || 500).json({
      ok: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Error creando proceso de medicion'
      }
    });
  }
};

module.exports = {
  createMeasurementProcessController
};
