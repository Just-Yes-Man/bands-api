class GetMeasurementProcessDetailUseCase {
  constructor({ measurementProcessesService }) {
    this.measurementProcessesService = measurementProcessesService;
  }

  async execute(input) {
    return this.measurementProcessesService.getProcessDetail(input);
  }
}

module.exports = {
  GetMeasurementProcessDetailUseCase
};
