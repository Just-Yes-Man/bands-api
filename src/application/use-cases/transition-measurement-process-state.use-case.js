class TransitionMeasurementProcessStateUseCase {
  constructor({ measurementProcessesService }) {
    this.measurementProcessesService = measurementProcessesService;
  }

  async execute(input) {
    return this.measurementProcessesService.transitionState(input);
  }
}

module.exports = {
  TransitionMeasurementProcessStateUseCase
};
