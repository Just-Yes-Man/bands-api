const { OrdersRepository } = require('../../../../infrastructure/db/repositories/orders.repository');
const { MeasurementProcessesRepository } = require('../../../../infrastructure/db/repositories/measurement-processes.repository');
const { asMeasurementError } = require('../../../../shared/errors/measurement-errors');

const ordersRepository = new OrdersRepository();
const measurementProcessesRepository = new MeasurementProcessesRepository();

const deny = (res) => {
  const error = asMeasurementError('PROCESS_FORBIDDEN');
  return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message } });
};

const requireMeasurementRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || (roles.length && !roles.includes(role))) {
    return deny(res);
  }
  return next();
};

const enforceMeasurementOwnershipByOrder = async (req, res, next) => {
  const role = req.user?.role;
  if (!req.user) {
    return deny(res);
  }

  if (role === 'admin' || role === 'supervisor' || role === 'operator') {
    return next();
  }

  const orderId = Number(req.params.orderId);
  if (!Number.isFinite(orderId)) {
    return deny(res);
  }

  const order = await ordersRepository.getById(orderId);
  if (!order || Number(order.cliente_id) !== Number(req.user.sub)) {
    return deny(res);
  }

  return next();
};

const enforceMeasurementOwnershipByProcess = async (req, res, next) => {
  const role = req.user?.role;
  if (!req.user) {
    return deny(res);
  }

  if (role === 'admin' || role === 'supervisor' || role === 'operator') {
    return next();
  }

  const processId = Number(req.params.processId);
  if (!Number.isFinite(processId)) {
    return deny(res);
  }

  const process = await measurementProcessesRepository.getById(processId);
  if (!process) {
    return deny(res);
  }

  const order = await ordersRepository.getById(process.pedido_id);
  if (!order || Number(order.cliente_id) !== Number(req.user.sub)) {
    return deny(res);
  }

  return next();
};

module.exports = {
  requireMeasurementRole,
  enforceMeasurementOwnershipByOrder,
  enforceMeasurementOwnershipByProcess
};
