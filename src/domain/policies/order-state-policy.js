const ORDER_STATUS = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  CANCELADO: 'CANCELADO'
};

const LINE_STATUS = {
  ACTIVA: 'ACTIVA',
  CANCELADA: 'CANCELADA',
  CERRADA: 'CERRADA'
};

const computeOrderStatus = ({ currentStatus, lineas, canceledByHeader = false }) => {
  if (currentStatus === ORDER_STATUS.CANCELADO || canceledByHeader) {
    return ORDER_STATUS.CANCELADO;
  }

  const total = lineas.length;
  const canceled = lineas.filter((l) => l.estado_linea === LINE_STATUS.CANCELADA).length;
  const closed = lineas.filter((l) => l.estado_linea === LINE_STATUS.CERRADA || l.estado_linea === LINE_STATUS.CANCELADA).length;

  if (total > 0 && canceled === total) {
    return ORDER_STATUS.CANCELADO;
  }

  if (total > 0 && closed === total) {
    return ORDER_STATUS.COMPLETADO;
  }

  const hasProgress = lineas.some((l) => (l.procesadas || 0) + (l.rechazadas || 0) > 0);
  if (hasProgress) {
    return ORDER_STATUS.EN_PROCESO;
  }

  return ORDER_STATUS.PENDIENTE;
};

module.exports = {
  ORDER_STATUS,
  LINE_STATUS,
  computeOrderStatus
};
