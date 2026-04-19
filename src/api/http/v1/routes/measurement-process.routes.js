const express = require('express');

const { authJwt } = require('../middlewares/auth-jwt');
const {
  requireMeasurementRole,
  enforceMeasurementOwnershipByOrder,
  enforceMeasurementOwnershipByProcess
} = require('../middlewares/measurement-auth');
const { createMeasurementProcessController } = require('../controllers/measurement-process-create.controller');
const { transitionMeasurementProcessStateController } = require('../controllers/measurement-process-state.controller');
const { registerMeasurementController } = require('../controllers/measurement-register.controller');
const { listMeasurementProcessesController } = require('../controllers/measurement-process-list.controller');
const { getMeasurementProcessDetailController } = require('../controllers/measurement-process-detail.controller');

const router = express.Router();

router.post(
  '/orders/:orderId/measurement-processes',
  authJwt,
  requireMeasurementRole('admin', 'supervisor', 'operator', 'client'),
  enforceMeasurementOwnershipByOrder,
  createMeasurementProcessController
);

router.get(
  '/orders/:orderId/measurement-processes',
  authJwt,
  requireMeasurementRole('admin', 'supervisor', 'operator', 'client'),
  enforceMeasurementOwnershipByOrder,
  listMeasurementProcessesController
);

router.get(
  '/measurement-processes/:processId',
  authJwt,
  requireMeasurementRole('admin', 'supervisor', 'operator', 'client'),
  enforceMeasurementOwnershipByProcess,
  getMeasurementProcessDetailController
);

router.post(
  '/measurement-processes/:processId/state',
  authJwt,
  requireMeasurementRole('admin', 'supervisor', 'operator', 'client'),
  enforceMeasurementOwnershipByProcess,
  transitionMeasurementProcessStateController
);

router.post(
  '/measurement-processes/:processId/measurements',
  authJwt,
  requireMeasurementRole('admin', 'supervisor', 'operator', 'client'),
  enforceMeasurementOwnershipByProcess,
  registerMeasurementController
);

module.exports = {
  measurementProcessRoutes: router
};
