const { parseListMeasurementProcessesQuery } = require('../../../../application/dto/query-measurement-processes.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asMeasurementError } = require('../../../../shared/errors/measurement-errors');

const { listMeasurementProcessesUseCase } = buildContainer();

const listMeasurementProcessesController = async (req, res) => {
  try {
    const parsed = parseListMeasurementProcessesQuery({ orderId: req.params.orderId });
    const data = await listMeasurementProcessesUseCase.execute({
      orderId: parsed.orderId,
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
        message: error.message || 'Error listando procesos de medicion'
      }
    });
  }
};

module.exports = {
  listMeasurementProcessesController
};
