const { ProductModel } = require('../../domain/entities/product-model.entity');
const { ProductModelRepository } = require('../../infrastructure/db/repositories/product-model.repository');

class ProductModelUseCase {
  constructor(repository = new ProductModelRepository()) {
    this.repository = repository;
  }

  async list() {
    return this.repository.listActive();
  }

  async create(input) {
    const entity = new ProductModel(input);
    return this.repository.create(entity);
  }
}

module.exports = {
  ProductModelUseCase
};
