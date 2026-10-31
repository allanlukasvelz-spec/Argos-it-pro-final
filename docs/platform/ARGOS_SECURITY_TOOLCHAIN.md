# ARGOS Security Toolchain

```
DATE = 2026-08-25
```

## Questions for every tool

Root? Docker socket? Host PID? Privileged? Outbound Internet? Web UI? Auth? Tenant isolation? Secrets? Command execution? Customer mutation?

Any YES on privileged/mutation → **explicit threat model** before GO.

## Candidates

| Tool | Privilege | Decision |
|------|-----------|----------|
| Trivy | Low (image/fs scan) | ADOPT_LATER |
| Semgrep | Low (CI) | POC |
| OWASP ZAP | Medium–High (active) | DEFER |
| Wazuh | High | DEFER/REJECT now |
| osquery | Medium | DEFER |
| Falco | High (eBPF/priv) | REJECT now |
| Agent Phase 7 | Low (allowlist) | KEEP / extend typed only |
| Nmap | Medium | REJECT unrestricted |

## Pipeline

```
scanner → finding → evidence → asset → severity → confidence → recommendation → verification → lifecycle
```

Distinguish: VULNERABILITY | MISCONFIGURATION | EXPOSURE | INFORMATIONAL | UNKNOWN.

Never auto-incident from raw scanner without policy.

## CHICO

May present security findings after ARGOS normalization. Is not the scanner.
