const { ProductModelUseCase } = require('../../../../application/use-cases/product-model.use-case');
const { createProductModelSchema, parseOrThrow } = require('../../../../application/dto/us1.dto');

const useCase = new ProductModelUseCase();

const listProductModels = async (req, res) => {
  const models = await useCase.list();
  res.status(200).json({ ok: true, data: models });
};

const createProductModel = async (req, res) => {
  try {
    const payload = parseOrThrow(createProductModelSchema, req.body);
    const model = await useCase.create(payload);
    return res.status(201).json({ ok: true, data: model });
  } catch (error) {
    if (error.message === 'VALIDATION_ERROR') {
      return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Payload invalido', details: error.details } });
    }
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Error creando modelo' } });
  }
};

module.exports = {
  listProductModels,
  createProductModel
};
