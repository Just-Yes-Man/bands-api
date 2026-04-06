const { buildContainer } = require('../../../../infrastructure/config/container');

const { getOrderDetailUseCase } = buildContainer();

const getOrderDetailController = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const data = await getOrderDetailUseCase.execute({ orderId, actor: req.user });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ ok: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message || 'Error consultando pedido' } });
  }
};

module.exports = {
  getOrderDetailController
};
