# 16 — Operations Handbook

## Resumen

Operaciones diarias del portal ARGOS-IT en Coolify/VPS.

## Estado

Operación estable con monitor */5 y backups daily.

**Última verificación UTC:** 2026-08-05T10:00Z

## Inventario — Accesos

| Rol | Cómo |
|---|---|
| Admin humano preferido | `ssh argosadmin@91.108.121.181` |
| Root (emergencias/Coolify) | `ssh root@…` clave |
| Panel | https://coolify.argos-it.com |

## Deploy producción

1. Confirmar auto-deploy **OFF**.
2. Merge/push autorizado a `deploy/production-v1`.
3. Deploy manual Coolify (API y/o Web según cambio).
4. Validar `/api/health` + portal 200.
5. Revisar monitor un ciclo.

## Rollback app

Coolify → redeploy imagen/commit anterior (`7be6f06` u otro tag retenido) · sin force-push main.

## Logs

```bash
docker logs <container> --since 30m
tail -f /root/argos-prod-ops/logs/monitor-$(date -u +%Y%m%d).log
journalctl -u ssh --since '1 hour ago'
```

## Backups / Restore

Ver `07_BACKUPS.md` y `15_DISASTER_RECOVERY.md`. Sync manual: `/root/argos-prod-ops/bin/r2-offsite-sync.sh` (solo si autorizado).

## Incidentes

1. SEV → runbook  
2. Contener (no reboot VPS sin auth)  
3. Evidencia  
4. Fix mínimo  
5. Postmortem  

## Checklist semanal

- [ ] Monitor sin alertas persistentes
- [ ] R2 dump count ≥ 7 días o tendencia OK
- [ ] Disco < 70%
- [ ] Coolify login OK
- [ ] Revisar Fail2Ban bans anómalos
- [ ] Staging smoke 200/200

## Checklist mensual

- [ ] Revisar retención R2
- [ ] Revisar imágenes dangling / espacio Docker
- [ ] Revisar usuarios SSH AllowUsers
- [ ] Actualizar este CMDB si hubo cambios
- [ ] Drill recuperación total servicio/VPS **si autorizado** (restore temporal ya validado)

## Checklist trimestral

- [ ] Revisión DR runbook
- [ ] Rotación selectiva secretos
- [ ] Capacidad CPU/RAM/disco
- [ ] Revisión riesgos `18_OPEN_RISKS.md`
- [ ] Patch Ubuntu / Docker (ventana)

## Dependencias

Coolify · DNS · R2 · ntfy · GitHub.

## Riesgos

Operar como root por hábito · cambiar UFW sin plan · auto-deploy staging sorpresa.

## Rollback

Fase rollbacks en `/root/argos-fase*-rollback/`.

## Observaciones

No tocar WordPress/MySQL/correo desde procedimientos portal salvo orden aparte.

**Última verificación UTC:** 2026-08-05T10:00Z
