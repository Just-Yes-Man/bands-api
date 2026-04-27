const fs = require('node:fs');
const path = require('node:path');

describe('integration migration monitor compatibility guards', () => {
  test('migration 004 includes monitores_proceso compatibility guardrails', () => {
    const migrationPath = path.resolve(process.cwd(), 'src/infrastructure/db/migrations/004_measurement_flow.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('ALTER TABLE monitores_proceso');
    expect(sql).toContain('idx_monitores_proceso_canal_activo');
    expect(sql).toContain('ck_monitores_proceso_canal_no_vacio');
    expect(sql).toContain('IF NOT EXISTS');
  });
});
