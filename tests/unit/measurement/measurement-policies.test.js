const {
  canTransitionProcessState,
  isTerminalState
} = require('../../../src/domain/policies/measurement-process-state-policy');
const {
  classifyMeasurementResult,
  MEASUREMENT_RESULTS
} = require('../../../src/domain/policies/measurement-result-policy');
const {
  isValidIdempotencyKey,
  normalizeIdempotencyKey
} = require('../../../src/domain/policies/measurement-idempotency-policy');

describe('measurement process state policy', () => {
  test('allows configured transition ESPERANDO -> EN_PROCESO', () => {
    expect(canTransitionProcessState({ from: 'ESPERANDO', to: 'EN_PROCESO' })).toBe(true);
  });

  test('rejects invalid transition COMPLETADO -> EN_PROCESO', () => {
    expect(canTransitionProcessState({ from: 'COMPLETADO', to: 'EN_PROCESO' })).toBe(false);
  });

  test('marks terminal states', () => {
    expect(isTerminalState('COMPLETADO')).toBe(true);
    expect(isTerminalState('FALLIDO')).toBe(true);
    expect(isTerminalState('CANCELADO')).toBe(true);
    expect(isTerminalState('EN_PROCESO')).toBe(false);
  });
});

describe('measurement result policy', () => {
  test('returns APROBADA only when all checks are true', () => {
    const result = classifyMeasurementResult({
      qrOk: true,
      pesoOk: true,
      colorOk: true,
      alturaOk: true
    });

    expect(result).toBe(MEASUREMENT_RESULTS.APROBADA);
  });

  test('returns RECHAZADA when any check is false', () => {
    const result = classifyMeasurementResult({
      qrOk: true,
      pesoOk: false,
      colorOk: true,
      alturaOk: true
    });

    expect(result).toBe(MEASUREMENT_RESULTS.RECHAZADA);
  });

  test('returns PENDIENTE when any check is missing', () => {
    const result = classifyMeasurementResult({
      qrOk: true,
      pesoOk: true,
      colorOk: true,
      alturaOk: undefined
    });

    expect(result).toBe(MEASUREMENT_RESULTS.PENDIENTE);
  });
});

describe('measurement idempotency policy', () => {
  test('normalizes key by trimming spaces', () => {
    expect(normalizeIdempotencyKey('  station-1-run-1  ')).toBe('station-1-run-1');
  });

  test('accepts valid idempotency key format', () => {
    expect(isValidIdempotencyKey('station-1-run-42-sample-001')).toBe(true);
  });

  test('rejects malformed idempotency key', () => {
    expect(isValidIdempotencyKey('bad key')).toBe(false);
    expect(isValidIdempotencyKey('a')).toBe(false);
  });
});
