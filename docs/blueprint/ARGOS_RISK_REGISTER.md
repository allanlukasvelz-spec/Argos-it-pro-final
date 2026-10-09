# ARGOS — Risk register

```
SCALE = qualitative (LOW/MEDIUM/HIGH/CRITICAL) — no fake %
```

| Risk | Probability | Impact | Detection | Prevention | Action A | Action B | Action C | Rollback |
|------|-------------|--------|-----------|------------|----------|----------|----------|----------|
| Tenant data leakage | MEDIUM until all APIs scoped | CRITICAL | isolation tests, audit logs | fail-closed tenant middleware | disable endpoint | patch WHERE | notify affected orgs | revert release |
| False HEALTHY | HIGH if engine naive | CRITICAL | coverage checks, self-health | UNKNOWN default | force UNKNOWN | stop publisher | hotfix | previous engine |
| False positive | MEDIUM | HIGH (trust) | confirm windows | N-fail rule | increase threshold | human ack | tune fingerprint | revert thresholds |
| False negative | MEDIUM | CRITICAL | stale observation age | UNKNOWN if stale | alert on runner | second probe | manual | — |
| Agent compromise | LOW until P7 then MEDIUM | CRITICAL | anomalous ingest | hashed tokens, isolate | freeze automations | rotate token | rebuild | new token only |
| Credential exposure | LOW | CRITICAL | secret scan | env, no keys in DB | rotate | invalidate sessions | customer notice | new secrets |
| Migration failure | MEDIUM (`_down` in glob) | HIGH | migrate logs | split up/down | stop migrate | restore backup | manual SQL | backup |
| Database failure | LOW | CRITICAL | `/api/health` | backups P12 | restart PG | replica | restore backup | replica failback |
| Notification failure | MEDIUM | HIGH | send errors | second channel | retry | alt channel | phone tree | — |
| Unsafe automation | HIGH if UI “Auto Fix” | CRITICAL | approval logs | L3 gate Level 1 policy | disable auto | patch UI | incident | previous build |
| DNS failure (customer) | MEDIUM | HIGH | DNS monitors P3 | baseline + lock | see failure matrix | — | — | zone snapshot |
| TLS renewal failure | MEDIUM | HIGH | TLS observe | 14d warning | matrix TLS | — | — | old cert |
| Backup failure (customer) | MEDIUM | CRITICAL | backup age | job monitors | matrix backup | — | — | last good backup |
| Monitoring failure | MEDIUM | CRITICAL | self heartbeat | P10 | restart runner | failover | freeze HEALTHY | previous runner |
| ARGOS platform outage | LOW | CRITICAL | health 503 | HA P12 | restart API | DB failover | status page | backup restore L4 never auto |
| Stash applied by mistake | LOW | HIGH | git stash list | procedure | `git stash` keep; reset hard **only if human ordered** | — | — | reflog |
| Relume/Framer contradict security | MEDIUM | HIGH | design review | Level 1 hierarchy | reject mock | adjust UI | — | — |
| Dual public chrome debt | HIGH (exists) | MEDIUM | visual e2e | freeze + Relume | keep contacto corporate | migrate later | — | — |
| org_role not enforced | HIGH (exists) | HIGH | code review | P4 RBAC | restrict destructive routes sooner | — | — | — |
| AI/security APIs unscoped | HIGH (exists) | HIGH | grep user_id | scope or freeze endpoints | add tenant | disable AI memory share | — | — |

---

## Residual risks accepted until a phase

- Public Home still legacy visual (Freeze 21.6B).  
- Dashboard monolith.  
- No monitoring (product cannot yet protect). **Do not market as 24/7 until P3 DONE.**
