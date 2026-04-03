const { CheckpointService } = require('../../../../application/services/checkpoint.service');
const { createCheckpointSchema, parseOrThrow } = require('../../../../application/dto/us1.dto');

const service = new CheckpointService();

const createCheckpoint = async (req, res) => {
  try {
    const payload = parseOrThrow(createCheckpointSchema, req.body);
    const result = await service.register(payload, req.user);

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.status(202).json(result);
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Payload invalido', details: error.details } });
    }

    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Error registrando checkpoint' } });
  }
};

const getCheckpointById = async (req, res) => {
  const result = await service.getById(Number(req.params.id));
  if (!result.ok) {
    return res.status(404).json(result);
  }
  return res.status(200).json(result);
};

module.exports = {
  createCheckpoint,
  getCheckpointById
};
