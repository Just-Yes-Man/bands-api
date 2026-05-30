const { z } = require('zod');

const processStateEnum = z.enum(['ESPERANDO', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO', 'CANCELADO']);

const createMeasurementProcessSchema = z.object({
  lineaPedidoId: z.number().int().positive().nullable().optional(),
  observacion: z.string().max(500).optional()
});

const transitionProcessStateSchema = z.object({
  estado: processStateEnum,
  observacion: z.string().max(500).optional()
});

const registerMeasurementSchema = z.object({
  modeloProductoId: z.number().int().positive(),
  idempotencyKey: z.string().min(6).max(120).regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{5,119}$/),
  qrOk: z.boolean().optional(),
  pesoOk: z.boolean().optional(),
  colorOk: z.boolean().optional(),
  alturaOk: z.boolean().optional()
});

const listMeasurementProcessesSchema = z.object({
  orderId: z.coerce.number().int().positive()
});

const getMeasurementProcessDetailSchema = z.object({
  processId: z.coerce.number().int().positive()
});

const parseOrThrow = (schema, payload) => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const error = new Error('VALIDATION_ERROR');
    error.details = result.error.issues;
    throw error;
  }
  return result.data;
};

module.exports = {
  processStateEnum,
  createMeasurementProcessSchema,
  transitionProcessStateSchema,
  registerMeasurementSchema,
  listMeasurementProcessesSchema,
  getMeasurementProcessDetailSchema,
  parseOrThrow
};
