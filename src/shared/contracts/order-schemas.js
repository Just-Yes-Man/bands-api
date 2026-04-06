const { z } = require('zod');

const orderLineSchema = z.object({
  modeloProductoId: z.number().int().positive(),
  cantidad: z.number().int().positive()
});

const createOrderSchema = z.object({
  clienteId: z.number().int().positive(),
  lineas: z.array(orderLineSchema).min(1)
}).superRefine((value, ctx) => {
  const seen = new Set();
  value.lineas.forEach((linea, index) => {
    if (seen.has(linea.modeloProductoId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Modelo duplicado dentro del pedido',
        path: ['lineas', index, 'modeloProductoId']
      });
    }
    seen.add(linea.modeloProductoId);
  });
});

const queryOrdersSchema = z.object({
  clienteId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const lineProgressUpdateSchema = z.object({
  deltaProcesadas: z.number().int().min(0),
  deltaRechazadas: z.number().int().min(0),
  version: z.number().int().min(0)
}).refine((v) => v.deltaProcesadas + v.deltaRechazadas > 0, {
  message: 'Debe reportarse al menos un delta mayor a cero'
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
  createOrderSchema,
  queryOrdersSchema,
  lineProgressUpdateSchema,
  parseOrThrow
};
