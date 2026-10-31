# ARGOS — Port & Network Matrix

```
SOURCE = docs/platform/port-registry.yaml + runtime @ 93b838f
```

| Port | Service | Bind CURRENT | Staging exposure | Production exposure | Auth | TLS |
|------|---------|--------------|------------------|---------------------|------|-----|
| 3000 | Frontend | 127.0.0.1 / 0.0.0.0 docker | Controlled ingress | Edge only | App session | Edge |
| 4000 | API | 0.0.0.0 listen default | Controlled / private | Edge / private API host | JWT cookie / agent / limited public | Edge |
| 5432 | PostgreSQL | private | **PRIVATE** | **PRIVATE** | scram/password | Prefer require |
| 9000 | MinIO API (POC canonical) | 127.0.0.1 | PRIVATE if used | Prefer managed S3 | Access keys | Prefer TLS |
| 9001 | MinIO console | 127.0.0.1 | **Admin private only** | Avoid / disable | Root creds | Prefer TLS |
| 9010/9011 | MinIO collision-safe POC | 127.0.0.1 | Same as 9000/9001 | N/A | Access keys | Prefer TLS |
| — | Worker | no listen | no inbound | no inbound | N/A | N/A |
| — | Scheduler | no listen | in API | in API | N/A | N/A |
| 4317 | OTel collector | TARGET | deferred | deferred | network | optional |
| 9090 | Prometheus | TARGET | deferred | deferred | network | optional |
| 3001 | Grafana | TARGET | deferred | deferred | auth | edge |

## Firewall expectations (staging)

```
ALLOW: operators → frontend:3000 (or 443 edge)
ALLOW: frontend → api:4000
ALLOW: api/worker → postgres:5432
ALLOW: api/worker → object store:9000
DENY:  world → postgres, minio, worker
DENY:  world → minio console
```

## Defaults

- PostgreSQL PRIVATE  
- MinIO API PRIVATE  
- MinIO console PRIVATE/admin only  
- Worker NO inbound  
- Scheduler NO inbound  
