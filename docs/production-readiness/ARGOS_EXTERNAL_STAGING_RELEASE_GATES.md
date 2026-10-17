# ARGOS — External Staging Release Gates

Extends [ARGOS_RELEASE_GATES.md](./ARGOS_RELEASE_GATES.md) for **external** staging.

| Gate | Name | External staging evidence |
|------|------|---------------------------|
| X0 | Human decisions | D1–D10 answered; budget authorized |
| X1 | Source | Exact Git SHA recorded |
| X2 | Pins | No `latest` on critical bases |
| X3 | Secrets | Unique; no test flags; cookie Secure=1 |
| X4 | Network | Postgres/MinIO/worker not public |
| X5 | TLS | Valid cert on staging hostname |
| X6 | Health | live/ready/FE external probes green |
| X7 | Backup off-host | Dump+objects+checksums off VM |
| X8 | Restore isolated | Drill ≠ primary |
| X9 | G12 | Against external origin |
| X10 | G13 | Playwright vs external FE/API |
| X11 | Harness | Fail-closed; optional IP restrict |
| X12 | Meta-monitor | ≥1 probe outside host |
| X13 | Rollback note | Prior digests documented |

## Policy

- Production gates remain **FORBIDDEN** until separate production authorization
- LOCAL_STAGING_VALIDATED does **not** auto-satisfy X7–X12
- Any public Postgres/MinIO → HOLD
- Scheduler multi-owner → fail (B1)

## Mapping to G0–G15

Local G0–G13 evidence informs confidence but must be **re-run** against the external environment after first deploy.
