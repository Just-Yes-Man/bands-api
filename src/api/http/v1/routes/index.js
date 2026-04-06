const express = require('express');

const { healthController } = require('../controllers/health.controller');
const { listProductModels, createProductModel } = require('../controllers/product-model.controller');
const { createCheckpoint, getCheckpointById } = require('../controllers/checkpoint.controller');
const { listMonitors, deactivateMonitor } = require('../controllers/process-monitor.controller');
const { docsRoutes } = require('./docs.routes');
const { authJwt } = require('../middlewares/auth-jwt');
const { rbac } = require('../middlewares/rbac');
const { clientAuthRoutes } = require('./client-auth-routes');
const { protectedRoutes } = require('./protected-routes');
const { ordersRoutes } = require('./orders.routes');

const router = express.Router();

router.get('/health', healthController);
router.use('/auth', clientAuthRoutes);
router.use('/protected', protectedRoutes);
router.use('/', ordersRoutes);
router.get('/product-models', authJwt, listProductModels);
router.post('/product-models', authJwt, rbac('admin'), createProductModel);
router.post('/checkpoints', authJwt, rbac('operator', 'supervisor', 'admin'), createCheckpoint);
router.get('/checkpoints/:id', authJwt, getCheckpointById);
router.get('/monitors', authJwt, rbac('supervisor', 'admin'), listMonitors);
router.patch('/monitors/:id/deactivate', authJwt, rbac('admin'), deactivateMonitor);
router.use('/', docsRoutes);

module.exports = {
  v1Routes: router
};
