class ListMeasurementProcessesUseCase {
  constructor({ measurementProcessesService }) {
    this.measurementProcessesService = measurementProcessesService;
  }

  async execute(input) {
    return this.measurementProcessesService.listProcessesByOrder(input);
  }
}

module.exports = {
  ListMeasurementProcessesUseCase
};
