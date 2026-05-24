const {
  buildContainer,
} = require("../../../../infrastructure/config/container");

const { cancelOrderUseCase } = buildContainer();

const cancelOrderController = async (req, res) => {
  try {
    const data = await cancelOrderUseCase.execute({
      orderId: Number(req.params.orderId),
      actor: req.user,
      io: req.app.get("io"),
    });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        ok: false,
        error: {
          code: error.code || "INTERNAL_ERROR",
          message: error.message || "Error cancelando pedido",
        },
      });
  }
};

module.exports = {
  cancelOrderController,
};
