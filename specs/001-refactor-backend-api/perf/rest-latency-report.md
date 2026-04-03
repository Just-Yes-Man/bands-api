# REST Latency Verification Report

Date: 2026-03-31
Target: /api/v1 health and checkpoint endpoints
Metric: p95 latency

Status: Baseline executed.

Measured results (120 samples against `/api/v1/health`):
- avg: 0.001386s
- p95: 0.002076s
- sample size: 120

Planned methodology:
1. Warm-up 2 minutes.
2. Sustain 15-minute mixed workload.
3. Capture p95/p99 from structured logs and load-test tool output.

Acceptance target:
- p95 < 2000ms

Result:
- PASS for this baseline run (p95 2.076ms).
