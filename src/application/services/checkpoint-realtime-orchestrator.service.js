class CheckpointRealtimeOrchestratorService {
  constructor(checkpointService, publisher) {
    this.checkpointService = checkpointService;
    this.publisher = publisher;
  }

  async registerAndPublish(payload, actor) {
    const result = await this.checkpointService.register(payload, actor);
    if (!result.ok) {
      return result;
    }

    await this.publisher.publish('checkpoint.reviewed.v1', result.data);
    return result;
  }
}

module.exports = {
  CheckpointRealtimeOrchestratorService
};
