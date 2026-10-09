# ARGOS — Retention Matrix

```
LEGAL CLAIMS = NONE — operational defaults only
```

| Data class | Suggested staging retain | Prod FUTURE propose | Notes |
|------------|--------------------------|---------------------|-------|
| Monitor observations | 14–30d | 30–90d | High volume |
| Agent observations | 14–30d | 30–90d | |
| Alerts | 90d | 1y | |
| Incidents + events | 1y | 1–3y | |
| Security logs | 90d–1y | ≥1y | AuthZ events |
| Activity logs | 90d | 1y | |
| Remediation events | 1y | 1–3y | |
| Evidence objects | per `retention_class` | STANDARD/SHORT/LONG/LEGAL_HOLD | Bytes + metadata |
| Reports / PDFs | 1y | 1–3y | Evidence-linked |
| Notifications | 90d | 180d | |
| platform_jobs COMPLETED | 30d | 90d | |
| DEAD_LETTER | 90d | 180d until reviewed | |
| LEGAL_HOLD | until released | until released | No automated delete |

## Tenant offboarding

1. Export if legally required (separate gate)  
2. Soft-delete org → cascade FKs carefully  
3. Delete/orphan evidence objects after grace  
4. Revoke agents  
5. Audit the offboarding action  

## Customer deletion

Must not break LEGAL_HOLD objects — block delete or escalate.
