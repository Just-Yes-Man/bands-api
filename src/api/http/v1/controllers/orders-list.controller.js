const { parseQueryOrders } = require('../../../../application/dto/query-orders.dto');
const { buildContainer } = require('../../../../infrastructure/config/container');
const { asOrderError } = require('../../../../shared/errors/order-errors');

const { listOrdersUseCase } = buildContainer();

const listOrdersController = async (req, res) => {
  try {
    const query = parseQueryOrders(req.query);
    const data = await listOrdersUseCase.execute({ ...query, actor: req.user });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      const e = asOrderError('ORDER_VALIDATION_ERROR', error.details);
      return res.status(e.statusCode).json({ ok: false, error: { code: e.code, message: e.message, details: e.details } });
    }
    return res.status(error.statusCode || 500).json({ ok: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Error listando pedidos' } });
  }
};

module.exports = {
  listOrdersController
};
