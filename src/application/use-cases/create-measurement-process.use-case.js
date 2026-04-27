class CreateMeasurementProcessUseCase {
  constructor({ measurementProcessesService }) {
    this.measurementProcessesService = measurementProcessesService;
  }

  async execute(input) {
    return this.measurementProcessesService.createProcess(input);
  }
}

module.exports = {
  CreateMeasurementProcessUseCase
};
