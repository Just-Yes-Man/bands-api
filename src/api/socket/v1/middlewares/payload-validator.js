const { z } = require('zod');

const schemas = {
  'product-model.create.v1': z.object({
    type: z.string().min(1),
    qrCode: z.string().min(1),
    expectedWeight: z.number(),
    expectedColor: z.string().min(1),
    expectedHeight: z.number()
  }),
  'checkpoint.register.v1': z.object({
    measuredQr: z.string().min(1),
    measuredWeight: z.number(),
    measuredColor: z.string().min(1),
    measuredHeight: z.number(),
    channel: z.string().optional()
  }),
  'checkpoint.review-next.v1': z.object({
    monitorId: z.number()
  })
};

const validatePayload = (eventName, payload) => {
  const schema = schemas[eventName];
  if (!schema) {
    return { ok: true, value: payload };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Payload invalido',
        details: result.error.issues
      }
    };
  }

  return { ok: true, value: result.data };
};

module.exports = {
  validatePayload
};
