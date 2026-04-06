const { parseLineProgressUpdatePayload } = require('../../../../application/dto/order-progress-update.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asOrderError } = require('../../../../shared/errors/order-errors');

const { updateOrderLineProgressUseCase } = buildContainer();

const updateOrderProgressController = async (req, res) => {
  try {
    const payload = parseLineProgressUpdatePayload(req.body);
    const data = await updateOrderLineProgressUseCase.execute({
      orderId: Number(req.params.orderId),
      lineId: Number(req.params.lineId),
      ...payload,
      actor: req.user,
      io: req.app.get('io')
    });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const e = asOrderError('ORDER_VALIDATION_ERROR', error.details);
      return res.status(e.statusCode).json({ ok: false, error: { code: e.code, message: e.message, details: e.details } });
    }
    return res.status(error.statusCode || 500).json({ ok: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Error actualizando progreso' } });
  }
};

module.exports = {
  updateOrderProgressController
};
