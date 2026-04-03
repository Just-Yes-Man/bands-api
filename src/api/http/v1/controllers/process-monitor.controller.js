const { ProcessMonitorUseCase } = require('../../../../application/use-cases/process-monitor.use-case');

const useCase = new ProcessMonitorUseCase();

const listMonitors = async (req, res) => {
  const data = await useCase.listActive();
  res.status(200).json({ ok: true, data });
};

const deactivateMonitor = async (req, res) => {
  const monitor = await useCase.deactivate(Number(req.params.id));
  if (!monitor) {
    return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Monitor no encontrado' } });
  }
  return res.status(200).json({ ok: true, data: monitor });
};

module.exports = {
  listMonitors,
  deactivateMonitor
};
