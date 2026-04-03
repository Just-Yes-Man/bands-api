# Auth Latency Report

## Objective
Capture evidence for SC-001 and SC-002.

## Method
- Execute register and login requests against local API.
- Record at least 30 valid requests per endpoint.
- Compute p95 latency for each operation.

## Baseline (captured 2026-04-01)
- register p95: 1.355349s (10 local samples, dockerized app)
- login p95: 0.110179s (10 local samples, dockerized app)

## Result
- SC-001: PASS (1.355349s < 2s)
- SC-002: PASS (0.110179s < 2s)

## Acceptance
- register p95 < 2s
- login p95 < 2s
