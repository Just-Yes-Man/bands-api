const { parseMeasurementProcessDetailQuery } = require('../../../../application/dto/query-measurement-processes.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asMeasurementError } = require('../../../../shared/errors/measurement-errors');

const { getMeasurementProcessDetailUseCase } = buildContainer();

const getMeasurementProcessDetailController = async (req, res) => {
  try {
    const parsed = parseMeasurementProcessDetailQuery({ processId: req.params.processId });
    const data = await getMeasurementProcessDetailUseCase.execute({
      processId: parsed.processId,
      actor: req.user
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
        message: error.message || 'Error consultando detalle del proceso'
      }
    });
  }
};

module.exports = {
  getMeasurementProcessDetailController
};
