const { parseCreateOrderPayload } = require('../../../../application/dto/create-order.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asOrderError } = require('../../../../shared/errors/order-errors');

const { createOrderUseCase } = buildContainer();

const createOrderController = async (req, res) => {
  try {
    const payload = parseCreateOrderPayload(req.body);
    const data = await createOrderUseCase.execute({ ...payload, actor: req.user, io: req.app.get('io') });
    return res.status(201).json({ ok: true, data });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const e = asOrderError('ORDER_VALIDATION_ERROR', error.details);
      return res.status(e.statusCode).json({ ok: false, error: { code: e.code, message: e.message, details: e.details } });
    }
    return res.status(error.statusCode || 500).json({ ok: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Error creando pedido' } });
  }
};

module.exports = {
  createOrderController
};
