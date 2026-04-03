const { z } = require('zod');

const createProductModelSchema = z.object({
  type: z.string().min(1),
  qrCode: z.string().min(1),
  expectedWeight: z.number(),
  expectedColor: z.string().min(1),
  expectedHeight: z.number()
});

const createCheckpointSchema = z.object({
  measuredQr: z.string().min(1),
  measuredWeight: z.number(),
  measuredColor: z.string().min(1),
  measuredHeight: z.number(),
  channel: z.string().optional(),
  modelReference: z.string().optional()
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
  createProductModelSchema,
  createCheckpointSchema,
  parseOrThrow
};
