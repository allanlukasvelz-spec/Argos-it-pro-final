# ARGOS — Remediation / Prevention / A-B-C model

```
PRINCIPLE = CENTRAL
IMPLEMENTATION = PHASE_6 (engine) ; PHASE_3 may *propose* read-only plans
```

---

## 1. Prevention vs remediation

| | Prevention | Remediation |
|--|------------|-------------|
| When | before failure | after/during failure |
| Input | trend + rules + context | incident + evidence |
| Output | preventive_action | remediation_action A/B/C |

Both require Why-this-action. Both respect automation levels.

---

## 2. Why this action (mandatory UI + API)

```
evidence
hypothesis
confidence: HIGH | MEDIUM | LOW | UNKNOWN
alternatives_considered[]
expected_result
risk
failure_signal
action_b
action_c
rollback
automation_level
```

Sin rollback definido → **no ejecutar** Level 2+.

---

## 3. Failure generates knowledge

```
A executed
A failure_signal matched
→ store evidence_out
→ eliminate hypotheses incompatible with that failure
→ boost remaining
→ select B (pre-declared, not improvised)
```

Improvisar “C inventada en caliente” está prohibido en automatización. Un humano NOC puede **añadir** un evento NOTE y un nuevo plan versionado; eso es Level 3 y auditado.

---

## 4. Flow

```
SIGNAL → EVIDENCE → HYPOTHESIS
→ ACTION A
    PASS → VERIFY → RESOLVE
    FAIL → FAILURE EVIDENCE → UPDATE HYPOTHESIS
→ ACTION B
    PASS → VERIFY → RESOLVE
    FAIL → ACTION C
        PASS → VERIFY
        FAIL → SAFE STOP / ROLLBACK / ESCALATE
```

---

## 5. Automation levels (examples)

| L | Name | Examples | Auto? |
|---|------|----------|-------|
| 0 | READ ONLY | re-fetch TLS, read logs, DNS lookup | yes |
| 1 | SAFE AUTOMATION | extra check, clear cache of ARGOS view, refresh observation | yes |
| 2 | REVERSIBLE CHANGE | rewrite a config file with backup, renew cert with previous cert kept | yes if rollback tested |
| 3 | HIGH IMPACT | restart systemd service, change DNS record, firewall rule | **human approval** |
| 4 | NEVER AUTO | DROP DATABASE, destroy VM, disable org auth, mass password reset | never |

UI: Level 3 = ApprovalGate. Level 4 = no auto control. Relume/Framer cannot relabel L3 as Auto Fix.

---

## 6. When ARGOS must stop

Ver Master §14. Resumen: UNKNOWN, A/B/C exhausted, no rollback, L3 without approval, L4, tenant ambiguity, platform degraded, alert storm, contradictory hypotheses, failure_signal during action.

---

## 7. Runbooks (data)

`runbooks.steps` JSON declara A/B/C por `signal` + `asset.type`.  
Ejemplo TLS EXPIRING: A = notify + observe SAN; B = request renewal (L2/L3); C = escalate + manual upload; rollback = revert to previous cert files.

Ejemplo CONN_REFUSED database: A = check DNS/TCP to host (L0); B = check listener/service (L0/L3 if restart); C = failover/escalate; **not** rotate passwords first.

---

## 8. Customer vs NOC language

NOC ve hipótesis y comandos. Cliente ve impacto + “ARGOS está actuando / necesita aprobación / está contenido”. Ver portal blueprint.
