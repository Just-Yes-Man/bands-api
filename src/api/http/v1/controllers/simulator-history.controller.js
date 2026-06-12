const { buildContainer } = require("../../../../infrastructure/config/container");

const { ordersService } = buildContainer();

const listSimulatorHistoryController = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const data = await ordersService.listSimulatorHistory({ limit });
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message || "Error consultando historial del simulador",
      },
    });
  }
};

module.exports = {
  listSimulatorHistoryController,
};
