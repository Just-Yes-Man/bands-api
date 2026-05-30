const {
  buildContainer,
} = require("../../../../infrastructure/config/container");

const { cancelOrderLineUseCase } = buildContainer();

const cancelOrderLineController = async (req, res) => {
  try {
    const data = await cancelOrderLineUseCase.execute({
      orderId: Number(req.params.orderId),
      lineId: Number(req.params.lineId),
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
          message: error.message || "Error cancelando linea",
        },
      });
  }
};

module.exports = {
  cancelOrderLineController,
};
