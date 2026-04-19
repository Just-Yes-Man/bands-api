const PROCESS_STATES = {
  ESPERANDO: 'ESPERANDO',
  EN_PROCESO: 'EN_PROCESO',
  COMPLETADO: 'COMPLETADO',
  FALLIDO: 'FALLIDO',
  CANCELADO: 'CANCELADO'
};

const ALLOWED_TRANSITIONS = {
  [PROCESS_STATES.ESPERANDO]: new Set([PROCESS_STATES.EN_PROCESO, PROCESS_STATES.CANCELADO]),
  [PROCESS_STATES.EN_PROCESO]: new Set([PROCESS_STATES.COMPLETADO, PROCESS_STATES.FALLIDO, PROCESS_STATES.CANCELADO]),
  [PROCESS_STATES.COMPLETADO]: new Set(),
  [PROCESS_STATES.FALLIDO]: new Set(),
  [PROCESS_STATES.CANCELADO]: new Set()
};

const isTerminalState = (state) => {
  return state === PROCESS_STATES.COMPLETADO
    || state === PROCESS_STATES.FALLIDO
    || state === PROCESS_STATES.CANCELADO;
};

const canTransitionProcessState = ({ from, to }) => {
  if (!from || !to || !ALLOWED_TRANSITIONS[from]) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].has(to);
};

module.exports = {
  PROCESS_STATES,
  ALLOWED_TRANSITIONS,
  isTerminalState,
  canTransitionProcessState
};
