class ProductCheckpointEvent {
  constructor({
    id = null,
    measuredQr,
    measuredWeight,
    measuredColor,
    measuredHeight,
    channel = '1',
    modelId = null,
    status = 'queued',
    approved = null,
    decisionWeightOk = null,
    decisionColorOk = null,
    decisionHeightOk = null,
    monitorId = null,
    performedBy = null
  }) {
    if (!measuredQr || measuredWeight === undefined || !measuredColor || measuredHeight === undefined) {
      throw new Error('mediciones obligatorias faltantes');
    }

    this.id = id;
    this.measuredQr = measuredQr;
    this.measuredWeight = Number(measuredWeight);
    this.measuredColor = measuredColor;
    this.measuredHeight = Number(measuredHeight);
    this.channel = channel;
    this.modelId = modelId;
    this.status = status;
    this.approved = approved;
    this.decisionWeightOk = decisionWeightOk;
    this.decisionColorOk = decisionColorOk;
    this.decisionHeightOk = decisionHeightOk;
    this.monitorId = monitorId;
    this.performedBy = performedBy;
  }

  evaluateAgainst(model) {
    this.decisionWeightOk = Number(model.expectedWeight) === this.measuredWeight;
    this.decisionColorOk = String(model.expectedColor).toLowerCase() === String(this.measuredColor).toLowerCase();
    this.decisionHeightOk = Number(model.expectedHeight) === this.measuredHeight;
    this.approved = this.decisionWeightOk && this.decisionColorOk && this.decisionHeightOk;
    this.status = 'reviewed';
    return this;
  }
}

module.exports = {
  ProductCheckpointEvent
};
