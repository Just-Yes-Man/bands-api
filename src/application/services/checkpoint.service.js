const { ProductCheckpointEvent } = require('../../domain/entities/product-checkpoint-event.entity');
const { ProductModelRepository } = require('../../infrastructure/db/repositories/product-model.repository');
const { CheckpointRepository } = require('../../infrastructure/db/repositories/checkpoint.repository');

class CheckpointService {
  constructor(
    modelRepository = new ProductModelRepository(),
    checkpointRepository = new CheckpointRepository()
  ) {
    this.modelRepository = modelRepository;
    this.checkpointRepository = checkpointRepository;
  }

  async register(input, actor = null) {
    const model = await this.modelRepository.findActiveByReference(input.modelReference || input.measuredQr);
    if (!model) {
      return {
        ok: false,
        error: {
          code: 'MODEL_NOT_FOUND',
          message: 'No hay modelo activo para comparar'
        }
      };
    }

    const event = new ProductCheckpointEvent(input).evaluateAgainst(model);
    event.modelId = model.id;
    event.performedBy = actor ? actor.sub || null : null;

    const stored = await this.checkpointRepository.create(event);

    return {
      ok: true,
      data: stored
    };
  }

  async getById(id) {
    const found = await this.checkpointRepository.findById(id);
    if (!found) {
      return {
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Checkpoint no encontrado'
        }
      };
    }

    return {
      ok: true,
      data: found
    };
  }
}

module.exports = {
  CheckpointService
};
