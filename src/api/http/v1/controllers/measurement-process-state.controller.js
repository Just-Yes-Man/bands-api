const { parseTransitionMeasurementProcessPayload } = require('../../../../application/dto/measurement-process.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asMeasurementError } = require('../../../../shared/errors/measurement-errors');

const { transitionMeasurementProcessStateUseCase } = buildContainer();

const transitionMeasurementProcessStateController = async (req, res) => {
  try {
    const payload = parseTransitionMeasurementProcessPayload(req.body);
    const data = await transitionMeasurementProcessStateUseCase.execute({
      processId: Number(req.params.processId),
      ...payload,
      actor: req.user,
      io: req.app.get('io')
    });

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const e = asMeasurementError('MEASUREMENT_VALIDATION_ERROR', error.details);
      return res.status(e.statusCode).json({ ok: false, error: { code: e.code, message: e.message, details: e.details } });
    }

    return res.status(error.statusCode || 500).json({
      ok: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Error transicionando estado del proceso'
      }
    });
  }
};

module.exports = {
  transitionMeasurementProcessStateController
};
