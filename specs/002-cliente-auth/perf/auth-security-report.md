# Auth Security Evidence Report

## Objective
Capture evidence for SC-007 and SC-008.

## Checks
- Rate limit rejects login attempts above threshold with stable response envelope.
- Login failures use generic message without disclosing user/password cause.
- Internal audit log retains detailed reason codes.

## Baseline (captured 2026-04-01)
- Generic login failure evidence:
	- First 5 invalid attempts returned `401` with `{ code: AUTH_FAILED, message: Credenciales invalidas }`.
- Rate-limit evidence:
	- 6th invalid attempt returned `429` with `{ code: AUTH_RATE_LIMITED, message: Demasiados intentos, intenta mas tarde }`.
- WebSocket protected auth evidence:
	- Valid token connection to `/realtime/v1` emitted `auth.ready.v1` with `{ ok: true, role: client, username: cliente_demo }`.

## Result
- SC-007: PASS
- SC-008: PASS
