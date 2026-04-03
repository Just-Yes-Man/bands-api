const { z } = require('zod');

const registerSchema = z.object({
  nombre: z.string().trim().min(1),
  contrasena: z.string().min(8).regex(/\d/, 'La contrasena debe incluir al menos un numero')
});

const loginSchema = z.object({
  nombre: z.string().trim().min(1),
  contrasena: z.string().min(1)
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
  registerSchema,
  loginSchema,
  parseOrThrow
};
