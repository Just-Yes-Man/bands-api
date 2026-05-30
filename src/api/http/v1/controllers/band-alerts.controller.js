const {
  buildContainer,
} = require("../../../../infrastructure/config/container");

const { bandAlertsPublisher } = buildContainer();

const resolveBandAlertController = async (req, res) => {
  try {
    const result = await bandAlertsPublisher.resolveAlert({
      errorId: req.body?.errorId,
      resolvedBy:
        req.body?.resolvedBy ||
        req.user?.username ||
        req.user?.sub ||
        req.client?.username ||
        "front",
    });

    if (result.skipped) {
      return res.status(503).json({
        ok: false,
        error: {
          code: "BAND_ALERTS_MQTT_DISABLED",
          message: "EMQX no esta habilitado para resolver alertas",
        },
      });
    }

    return res.status(202).json({ ok: true, data: result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: {
        code: "BAND_ALERT_RESOLVE_FAILED",
        message: error.message || "No se pudo resolver la alerta de bandas",
      },
    });
  }
};

module.exports = {
  resolveBandAlertController,
};
