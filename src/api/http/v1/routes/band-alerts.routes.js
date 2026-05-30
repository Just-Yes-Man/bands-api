const express = require("express");

const { authJwt } = require("../middlewares/auth-jwt");
const { resolveBandAlertController } = require("../controllers/band-alerts.controller");

const router = express.Router();

router.post("/band-alerts/resolve", authJwt, resolveBandAlertController);

module.exports = {
  bandAlertsRoutes: router,
};
