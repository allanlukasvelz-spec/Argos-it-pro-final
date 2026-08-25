# ARGOS Container Strategy

```
DATE = 2026-08-25
K8S_ADOPT_NOW = NO
```

## CURRENT

Docker Compose: `db`, `backend`, `frontend`. Dockerfiles with healthchecks. No resource limits enforced in compose today (gap).

## Hardening TARGET for Compose

- CPU/memory limits
- read-only root where feasible
- no Docker socket mounts
- pinned image digests
- secrets via env/files not baked in
- network segmentation (db not published)

## Image security

SBOM + Trivy in CI (**ADOPT_LATER**). Fail build on CRITICAL policy.

## Kubernetes

**K8S_ADOPT_NOW = NO**

Why: 3-service app; single-node Coolify/VPS ops; Compose + Traefik sufficient through S1; K8s ops cost exceeds benefit.

**Triggers for future adoption:**

- Multi-node HA required
- Many worker pools with autoscaling
- Dedicated platform ops capacity
- Regulatory need for k8s-native controls

Until triggers: **REJECT**.
