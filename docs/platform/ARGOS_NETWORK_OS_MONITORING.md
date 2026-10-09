# ARGOS Network / OS Monitoring

```
DATE = 2026-08-25
```

## Host inventory TARGET

```
HOST
├── OS (family, version, kernel, patch state, uptime)
├── CPU / RAM / Disk / Filesystems
├── Services / Processes (typed, not shell dumps)
├── Network (interfaces, routes, listening ports, connectivity)
├── Containers (inventory)
└── Security (agent status, findings links)
```

Delivery: **typed agent capabilities** only. NO generic command execution.

## Port model

| Concept | Meaning |
|---------|---------|
| EXPECTED | Declared in asset policy |
| OBSERVED | Seen by agent/probe |
| EXTERNALLY_EXPOSED | Reachable from untrusted network |
| INTERNAL | Not externally exposed |
| UNEXPECTED | Observed ∉ expected |
| UNKNOWN | Insufficient evidence |

Open port ≠ vulnerability.

## Scanner scope (mandatory before Nmap/ZAP)

- Explicit asset ownership
- Deny cross-tenant targets
- Deny arbitrary CIDR / Internet-wide
- Audit every scan job
- Rate and concurrency limits
