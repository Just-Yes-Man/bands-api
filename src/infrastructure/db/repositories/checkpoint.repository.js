const { pool } = require('../postgres');

class CheckpointRepository {
  async create(data) {
    const query = `
      INSERT INTO product_checkpoint_events (
        measured_qr, measured_weight, measured_color, measured_height,
        model_id, channel, decision_weight_ok, decision_color_ok, decision_height_ok,
        approved, status, monitor_id, performed_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING id, measured_qr AS "measuredQr", measured_weight AS "measuredWeight",
                measured_color AS "measuredColor", measured_height AS "measuredHeight",
                model_id AS "modelId", channel, approved, status,
                decision_weight_ok AS "decisionWeightOk", decision_color_ok AS "decisionColorOk",
                decision_height_ok AS "decisionHeightOk", monitor_id AS "monitorId", created_at AS "createdAt";
    `;

    const { rows } = await pool.query(query, [
      data.measuredQr,
      data.measuredWeight,
      data.measuredColor,
      data.measuredHeight,
      data.modelId,
      data.channel,
      data.decisionWeightOk,
      data.decisionColorOk,
      data.decisionHeightOk,
      data.approved,
      data.status,
      data.monitorId,
      data.performedBy
    ]);

    return rows[0];
  }

  async findById(id) {
    const query = `
      SELECT id, measured_qr AS "measuredQr", measured_weight AS "measuredWeight",
             measured_color AS "measuredColor", measured_height AS "measuredHeight",
             model_id AS "modelId", channel, approved, status,
             decision_weight_ok AS "decisionWeightOk", decision_color_ok AS "decisionColorOk",
             decision_height_ok AS "decisionHeightOk", monitor_id AS "monitorId", created_at AS "createdAt"
      FROM product_checkpoint_events
      WHERE id = $1
      LIMIT 1;
    `;

    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
}

module.exports = {
  CheckpointRepository
};
