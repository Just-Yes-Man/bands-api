class RegisterMeasurementUseCase {
  constructor({ measurementCaptureService }) {
    this.measurementCaptureService = measurementCaptureService;
  }

  async execute(input) {
    return this.measurementCaptureService.registerMeasurement(input);
  }
}

module.exports = {
  RegisterMeasurementUseCase
};
