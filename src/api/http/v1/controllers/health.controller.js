const healthController = async (req, res) => {
  res.status(200).json({
    ok: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};

module.exports = {
  healthController
};
