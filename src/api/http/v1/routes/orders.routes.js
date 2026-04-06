const express = require('express');

const { authJwt } = require('../middlewares/auth-jwt');
const { requireOrdersRole, enforceOrderOwnership } = require('../middlewares/orders-auth');
const { createOrderController } = require('../controllers/orders-create.controller');
const { listOrdersController } = require('../controllers/orders-list.controller');
const { getOrderDetailController } = require('../controllers/orders-detail.controller');
const { updateOrderProgressController } = require('../controllers/orders-progress.controller');
const { cancelOrderLineController } = require('../controllers/orders-line-cancel.controller');

const router = express.Router();

router.post('/orders', authJwt, requireOrdersRole('admin', 'supervisor', 'operator', 'client'), createOrderController);
router.get('/orders', authJwt, enforceOrderOwnership, listOrdersController);
router.get('/orders/:orderId', authJwt, requireOrdersRole('admin', 'supervisor', 'operator', 'client'), getOrderDetailController);
router.post('/orders/:orderId/lines/:lineId/progress', authJwt, requireOrdersRole('admin', 'supervisor', 'operator'), updateOrderProgressController);
router.post('/orders/:orderId/lines/:lineId/cancel', authJwt, requireOrdersRole('admin', 'supervisor', 'operator'), cancelOrderLineController);

module.exports = {
  ordersRoutes: router
};
