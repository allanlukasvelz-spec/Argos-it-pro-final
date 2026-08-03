# Cloudflare Tunnel Architecture Design — Coolify Admin

## 1. Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Document** | `docs/CLOUDFLARE_TUNNEL_ARCHITECTURE_DESIGN.md` |
| **Phase** | **10C.5** |
| **Revision** | 1 |
| **Type** | DESIGN ONLY — NO IMPLEMENTATION |
| **Authoritative inputs** | `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` (Rev 2); `docs/CLOUDFLARE_ZONE_STAGING_DESIGN.md` (Rev 1); `docs/PRODUCTION_DR_RUNBOOK.md` (v1.0); Production Security Baseline (phase PASS — not a committed file in repo); PHASE 10C.2A security headers (phase PASS — result not stored as committed artifact) |
| **Implementation authorized** | **NO** |
| **Tunnel creation authorized** | **NO** |

### Related phase map

| Phase | Scope | Relation to this document |
| --- | --- | --- |
| 10C.3A / 10C.4 | DNS + zone staging design | Prerequisite designs; DNS cutover must not depend on Tunnel |
| **10C.5** | Tunnel architecture design | This document |
| 10C.6 | Cloudflare Access | Access policies — out of scope here (boundary only) |
| 10C.7 | Origin lockdown | Close raw admin ports after Tunnel+Access validated |
| 10C.8 / 10C.9 | Firewall / SSH hardening | After origin lockdown baseline |

---

## 2. Authority and non-authorization notice

This document is **design and documentation only**.

It does **not** authorize:

- installation of `cloudflared`;
- creation of a Cloudflare Tunnel or credentials;
- DNS routes, CNAME changes, zone create, or NS cutover;
- Cloudflare Access applications or policies;
- Hostinger, Cloudflare account, Docker, Compose, Traefik, Coolify, firewall, or SSH changes;
- closing ports `8000`, `6001`, `6002`, `8080`, or `22`;
- service restarts, deploys, commits, or pushes.

No infrastructure was modified by producing this document.

---

## 3. Executive Summary

PHASE 10C.5 designs a **production-grade Cloudflare Tunnel** as the private transport for **Coolify administrative access**, so operators can reach Coolify from **changing networks** without static IP allowlists.

**Target future control plane (not implemented here):**

```
Operator (any network)
  → Cloudflare Edge + Access (10C.6)
  → Cloudflare Tunnel
  → cloudflared on VPS
  → Coolify origin (recommended: http://127.0.0.1:8000)
  → Coolify native login (remains enabled)
```

**Non-goals of this phase:**

- Portal (`portal.argos-it.com`) and API (`api.portal.argos-it.com`) stay **public**, outside Tunnel and Access.
- Tunnel alone **does not** close raw ports — residual exposure remains until 10C.7+.
- SSH remains outside this phase.
- Full Access policy design belongs to **10C.6**.

**Recommended pattern (summary):**

| Decision | Choice | Rationale |
| --- | --- | --- |
| Deployment | **A — host systemd `cloudflared`** | Independent of Coolify lifecycle; break-glass survivable; no circular dependency |
| Origin target | **`http://127.0.0.1:8000`** (primary) | Direct Coolify UI; enables later external close of `:8000`; minimal Traefik coupling |
| Hostname | **Keep `coolify.argos-it.com`** | Lowest user/DNS/Coolify impact; aligns with DR runbook |
| Proxy model | Tunnel public hostname (not classic orange-cloud to origin IP) | Prefer private origin transport for admin |
| Replicas on one VPS | **Single connector** | Multiple replicas on one host ≠ HA |

**Hard dependency for production hostname cutover to Tunnel:** Cloudflare DNS authority for `argos-it.com` (or an explicitly authorized Hostinger CNAME to `*.cfargotunnel.com`) — preferred path is **zone active + validated** per 10C.4 before publishing `coolify` via Tunnel.

---

## 4. Current State

| Item | Status |
| --- | --- |
| Authoritative DNS | Hostinger parking NS (`ns1/ns2.dns-parking.com`) |
| Cloudflare DNS zone for domain | Not staged / not active |
| NS cutover | Not done |
| `cloudflared` on VPS | Not installed |
| Tunnel | Not created |
| Access application | Not created |
| Coolify UI hostname | `https://coolify.argos-it.com` → A `91.108.121.181` |
| Coolify host port | `:8000` published (raw admin surface) |
| Realtime ports | `:6001` / `:6002` published |
| Traefik host publish | `:8080` published |
| Portal / API | Must remain publicly accessible via Traefik |
| Coolify native auth | Must remain enabled |
| SSH | Outside this phase |
| Origin lockdown | Outside this phase |
| Hostinger panel export | Still mandatory before DNS migration implementation |
| VPS | `91.108.121.181` |
| Monitor | `/root/argos-prod-ops/bin/monitor-production.sh` (every 5 min) |
| Coolify version pin | ~v4.1.x observed in DR — exact pin **PENDIENTE** |
| Production Security Baseline | Phase PASS (input); artifact not committed in repo — treat as prior constraint: harden admin path without breaking portal/API |
| 10C.2A security headers | Phase PASS (input); headers apply to portal/API path — Tunnel must not regress public TLS/header posture |

### Current Coolify access paths (residual exposure)

| Path | Exposure |
| --- | --- |
| `https://coolify.argos-it.com` via Traefik | Public DNS → VPS |
| `http(s)://<IP>:8000` | Direct host port |
| `:6001` / `:6002` | Realtime / WebSocket surfaces |
| `:8080` | Traefik publish surface |
| `:22` | SSH (out of scope) |

**Critical design truth:** Installing Tunnel without later lockdown leaves a **false sense of security** while raw ports remain open.

---

## 5. Architecture Options

### Option A — `cloudflared` as host systemd service

| Dimension | Assessment |
| --- | --- |
| Architecture | Binary/package on VPS; `systemd` unit; egress-only to Cloudflare; ingress rule → local origin |
| Dependencies | Host OS, systemd, outbound HTTPS/QUIC, DNS resolution, Tunnel token |
| Privileges | Root (or dedicated system user) to install unit; runtime should drop to dedicated user where possible |
| Network access | Host loopback / host ports; no Docker network required for `127.0.0.1:8000` |
| Credential storage | Host path e.g. `/etc/cloudflared/` (mode `600`, root or `cloudflared` user) — never Git |
| Lifecycle | Independent of Coolify/Docker app redeploys |
| Restart behavior | `Restart=always`; starts on boot before/without Coolify UI availability |
| Update strategy | Distro package or pinned GitHub release; CAB-controlled |
| Coolify compatibility | High — outside Coolify resource graph |
| Traefik compatibility | High — can bypass Traefik for admin origin |
| Operational risk | Host package drift; manual upgrade discipline |
| Security benefit | Strong — tunnel survives Coolify container loss; clear blast radius |
| Recovery complexity | Low–medium — restore unit + credential from secure backup |
| Persistence | High across Coolify upgrades |
| Observability | `journalctl -u cloudflared`; Cloudflare connector status |
| Rollback | Stop/disable unit; leave DNS A to VPS while ports open |

### Option B — `cloudflared` as dedicated Docker container (not Coolify-managed)

| Dimension | Assessment |
| --- | --- |
| Architecture | Standalone container / compose stack **outside** Coolify UI resources |
| Dependencies | Docker daemon; image pin; network mode (`host` or bridge + reachability to origin) |
| Privileges | Docker socket not required if using token mode; avoid mounting Docker socket |
| Network access | `network_mode: host` → easy `127.0.0.1:8000`; or bridge → need `host.docker.internal` / gateway IP (**PENDING host verification**) |
| Credential storage | Docker secret / bind-mount file mode `600`; never in compose committed to Git |
| Lifecycle | Independent of Coolify app deploys if stack is separate |
| Restart behavior | `restart: unless-stopped`; depends on Docker after reboot |
| Update strategy | Image digest pin + recreate |
| Coolify compatibility | Good if **not** registered as Coolify-managed (avoids accidental delete) |
| Traefik compatibility | Good if origin is loopback/host |
| Operational risk | Accidental `docker prune`; compose file drift; network mode mistakes |
| Security benefit | Process isolation; still host-local secrets |
| Recovery complexity | Medium — recreate container + remount credential |
| Persistence | Medium–high if stack lives outside Coolify |
| Observability | Container logs + CF connector status |
| Rollback | Stop container; DNS/path unchanged while ports open |

### Option C — `cloudflared` as Coolify-managed service

| Dimension | Assessment |
| --- | --- |
| Architecture | Coolify resource runs cloudflared image |
| Dependencies | Coolify control plane healthy to manage/restart connector |
| Privileges | Whatever Coolify grants the service |
| Network access | Coolify Docker networks; may reach `coolify` service by name |
| Credential storage | Coolify secrets / env — risk of UI-visible secret sprawl |
| Lifecycle | Tied to Coolify upgrades, resource edits, accidental stop |
| Restart behavior | Depends on Coolify + Docker |
| Update strategy | Coolify redeploy |
| Coolify compatibility | **Circular dependency:** tunnel protects Coolify; Coolify manages tunnel |
| Traefik compatibility | Risk of unwanted public Traefik exposure if mislabeled |
| Operational risk | **High** — Coolify outage or mis-click can drop admin path |
| Security benefit | Weaker operationally despite technical tunnel |
| Recovery complexity | High if Coolify UI is the only management path |
| Persistence | Fragile across Coolify upgrades |
| Observability | Mixed Coolify logs + CF |
| Rollback | Coolify UI / CLI; may be unavailable if Access/Tunnel broken |

### Pattern comparison (decision factors)

| Factor | A systemd | B Docker standalone | C Coolify-managed |
| --- | --- | --- | --- |
| Circular dependency | None | None (if outside Coolify) | **Yes — reject** |
| Survives Coolify upgrade | Best | Good | Worst |
| Break-glass on Coolify failure | Best | Good | Poor |
| Aligns with DR rebuild | Clear host restore step | Extra compose restore | Couples to Coolify rebuild |
| Convenience | Medium | High | Highest (rejected) |

---

## 6. Recommended Architecture

### Primary recommendation: **Option A — host systemd `cloudflared`**

Chosen for **security and recovery**, not convenience:

1. No circular dependency with Coolify.
2. Persists across Coolify container upgrades/recreates.
3. Aligns with break-glass: SSH + systemd can restore admin path without Coolify UI.
4. Cleanest fit for later origin lockdown (`:8000` closed externally while loopback remains for tunnel).
5. Matches single-VPS reality without pretending container replicas = HA.

### Acceptable alternate: **Option B — Docker standalone (not Coolify-managed)**

Allowed only if future host inspection shows policy preference for containerized edge agents **and** the stack is explicitly excluded from Coolify-managed resources. Prefer `network_mode: host` or proven reachability to `127.0.0.1:8000`.

### Rejected: **Option C — Coolify-managed**

Rejected due to circular dependency and upgrade/delete risk.

### Target logical architecture

```
                    ┌──────────────────────────────────────┐
                    │ Cloudflare Edge                      │
  Operator ────────►│  Access challenge (10C.6)            │
  (any network)     │  Tunnel public hostname              │
                    └──────────────────┬───────────────────┘
                                       │ Cloudflare Tunnel
                                       ▼
                    ┌──────────────────────────────────────┐
                    │ VPS 91.108.121.181                   │
                    │  cloudflared (systemd)               │
                    │       │                              │
                    │       ▼                              │
                    │  http://127.0.0.1:8000  Coolify UI   │
                    │       │                              │
                    │       ├── dashboard / deploy / logs  │
                    │       └── terminal / WS (verify)     │
                    │                                      │
                    │  Traefik (coolify-proxy)              │
                    │       ├── portal.argos-it.com PUBLIC │
                    │       └── api.portal.argos-it.com PUBLIC
                    │                                      │
                    │  Residual until 10C.7+:              │
                    │    :8000 :6001 :6002 :8080 (:22)     │
                    └──────────────────────────────────────┘
```

### Single connector policy

On a **single VPS**, run **one** `cloudflared` connector for this Tunnel.

- Additional replicas on the same host do **not** provide host HA.
- Do not claim high availability while compute, Docker, and disk are shared.

---

## 7. Origin Target Design

### Evaluated targets

#### T1 — `http://127.0.0.1:8000` (**recommended primary**)

| Dimension | Assessment |
| --- | --- |
| DNS/TLS implications | Tunnel edge provides public HTTPS; origin is plain HTTP on loopback — normal Tunnel pattern |
| WebSocket compatibility | Generally good for HTTP upgrade on same port — **PENDING VERIFICATION** for Coolify terminal/realtime |
| Host header | cloudflared can set/preserve hostname; Coolify often expects `coolify.argos-it.com` — **PENDING VERIFICATION** |
| Redirect behavior | Risk if Coolify redirects to HTTPS absolute URL incorrectly — validate |
| Certificate validation | N/A for HTTP origin |
| Traefik dependency | **None** for this path |
| Host port publication | Uses existing Coolify listen on `:8000`; later firewall can block **external** `:8000` while loopback remains |
| Operational risk | Low if Coolify always binds `127.0.0.1` or `0.0.0.0:8000` as today |
| Rollback complexity | Low — stop tunnel route; use direct Traefik/IP paths while ports open |

#### T2 — `http://coolify:8080` on Docker network

| Dimension | Assessment |
| --- | --- |
| DNS/TLS | HTTP internal; needs Docker DNS name `coolify` |
| WebSocket | Possible if service serves WS on container port |
| Host header | May need explicit Host |
| Redirects | Possible internal redirect issues |
| Cert validation | N/A |
| Traefik dependency | None |
| Host port publication | Can reduce reliance on published `:8000` **if** container port is correct |
| Operational risk | **PENDING VERIFICATION** of Coolify container name/port; network attachment for systemd binary harder than for Docker cloudflared |
| Rollback | Medium |

**Status:** Candidate only if host inspection proves container port and network; not primary for systemd recommendation.

#### T3 — HTTPS via local Traefik hostname (`https://coolify.argos-it.com` → Traefik)

| Dimension | Assessment |
| --- | --- |
| DNS/TLS | Double TLS / origin cert validation complexity |
| WebSocket | Depends on Traefik WS settings |
| Host header | Must match Traefik router |
| Redirects | Higher risk of redirect loops |
| Certificate validation | cloudflared must trust LE cert or skip-verify (discouraged) |
| Traefik dependency | **Hard** — Traefik failure takes admin tunnel down |
| Host port publication | Still depends on Traefik `:443` / publish model |
| Operational risk | Higher coupling; couples admin path to public proxy |
| Rollback | Medium |

**Status:** Not recommended for admin Tunnel origin.

#### T4 — Direct origin service (non-HTTP)

| Dimension | Assessment |
| --- | --- |
| Notes | Coolify admin is HTTP(S) UI — non-HTTP TCP tunnel features are a different model |
| Status | Out of scope unless future verified need for raw TCP to `:6001`/`:6002` |

#### T5 — Dedicated internal-only router

| Dimension | Assessment |
| --- | --- |
| Notes | Extra Traefik/entrypoint only on internal listener |
| Benefit | Clean separation from public routers |
| Cost | More Coolify/Traefik change surface |
| Status | Optional future hardening — **not required** for first Tunnel design |

### Origin decision

| Priority | Target | When |
| --- | --- | --- |
| **Primary** | `http://127.0.0.1:8000` | Default implementation design |
| Alternate | Docker service URL | Only after host evidence for name/port/network |
| Rejected for v1 | HTTPS via Traefik hostname | Unnecessary coupling |
| Deferred | Separate TCP ingress to `:6001`/`:6002` | Only if WebSocket/realtime **cannot** ride UI origin — **PENDING VERIFICATION** |

---

## 8. Hostname Design

### Options

| Option | Hostname | Recommendation |
| --- | --- | --- |
| H1 | `coolify.argos-it.com` | **Preferred** |
| H2 | `admin.argos-it.com` | Optional later rename — more DNS/Coolify churn |
| H3 | `coolify.admin.argos-it.com` | More labels; little security gain vs Access |

### Evaluation

| Factor | Keep `coolify.argos-it.com` | `admin.argos-it.com` | `coolify.admin.argos-it.com` |
| --- | --- | --- | --- |
| User impact | None | Bookmark/docs change | Higher confusion |
| DNS dependencies | Existing A in inventory | New record + retire old | New record |
| Certificates | Existing Traefik/LE name | New cert issuance | New cert |
| Coolify config | APP_URL / trusted hosts likely already set | Must reconfigure | Must reconfigure |
| Access mapping | One app on known host | New app hostname | New app hostname |
| Rollback | Revert Tunnel DNS to A `91.108.121.181` | Dual-name complexity | Dual-name complexity |

### Hostname decision

**Keep `coolify.argos-it.com`.**

Portal and API remain **outside** Tunnel and Access:

| Hostname | Tunnel | Access (10C.6) |
| --- | --- | --- |
| `coolify.argos-it.com` | Yes (future) | Yes (future) |
| `portal.argos-it.com` | **No** | **No** |
| `api.portal.argos-it.com` | **No** | **No** |
| `staging.argos-it.com` | No (unless separate decision) | No |

### DNS publication model (future)

Preferred (after CF zone active):

1. Cloudflare Tunnel creates public hostname route for `coolify.argos-it.com`.
2. DNS for `coolify` becomes Tunnel-managed CNAME (proxied by Cloudflare edge for Tunnel), **not** classic A to `91.108.121.181`.
3. Portal/API remain DNS-only A → `91.108.121.181` (grey-cloud) unless a later separate proxy design is approved.

Alternate (only with explicit authorization): Hostinger CNAME `coolify` → `<tunnel-id>.cfargotunnel.com` before full NS cutover. Higher change-control cost; not preferred.

---

## 9. Ingress Rules

### Design principles

- Prefer **one hostname** → **one primary HTTP origin** if Coolify serves UI + terminal WS on `:8000`.
- Do **not** invent unverified paths; mark unknowns as **PENDING VERIFICATION**.
- Always define a catch-all deny/404 for unmatched Tunnel ingress.

### Conceptual ingress order (hostname `coolify.argos-it.com`)

| Order | Match | Origin | Notes |
| --- | --- | --- | --- |
| 1 | `coolify.argos-it.com` / (all paths) | `http://127.0.0.1:8000` | Primary catch for UI |
| 2 | *(optional, only if verified)* separate hostname or path for realtime | `http://127.0.0.1:6001` or `:6002` | **PENDING VERIFICATION** — only if UI origin cannot carry realtime |
| last | `*` catch-all | HTTP 404 | No accidental routing to portal/API/origin IP |

### Path requirements (verification status)

| Path / traffic | Required for | Status |
| --- | --- | --- |
| `/` | Coolify UI entry | Expected |
| `/login` (or Coolify login route) | Native auth | Expected — exact path **PENDING VERIFICATION** |
| `/app` | SPA/app shell | Cited in Coolify UIs — **PENDING VERIFICATION** on this host |
| `/terminal` | Terminal UI | **PENDING VERIFICATION** |
| `/terminal/ws` | Terminal WebSocket | **PENDING VERIFICATION** |
| WebSocket upgrade (`Connection: Upgrade`) | Terminal / live views | Must be allowed end-to-end — **PENDING VERIFICATION** |
| Realtime / Soketi / Pusher paths | Deploy logs / live UI | Ports `6001`/`6002` exist — exact HTTP paths **PENDING VERIFICATION** |
| Catch-all 404 | Safety | Required in design |

### One hostname vs multiple ingress rules

| Model | Decision |
| --- | --- |
| Single hostname + single HTTP origin | **Default design** |
| Additional ingress for `:6001`/`:6002` | Only after proof that realtime fails through `:8000` |
| Separate admin hostname | Not required for v1 |

### Explicit non-ingress

Tunnel must **never** publish:

- `portal.argos-it.com`
- `api.portal.argos-it.com`
- Hostinger mail / apex / www
- Raw SSH

---

## 10. Access Integration Boundary

Full Access policy design is **PHASE 10C.6**. This section defines only the Tunnel↔Access boundary.

| Boundary item | Design rule |
| --- | --- |
| Protected hostname | `coolify.argos-it.com` only |
| Tunnel role | Private origin transport (connector); not a substitute for identity |
| Access role | Identity gate **in front of** Tunnel hostname (10C.6) |
| Coolify native login | **Remains enabled** (defense in depth) |
| Portal/API | No Access |
| Session compatibility | Access session cookies must not break Coolify session cookies — validate in 10C.6 |
| WebSocket compatibility | Access must allow WS upgrade for terminal/realtime after auth — validate in 10C.6 |
| Service tokens | Not required for human admin path in v1; optional later for automation — **PENDING** if CI needs Coolify API |
| Bypasses forbidden | No “Bypass” for `/terminal` or WS paths; no IP bypass that reintroduces open admin |
| Unauthenticated behavior | Unauthenticated client must see **Access login/challenge**, not Coolify login, when Access is enabled |
| Pre-Access Tunnel phase | If Tunnel is published before Access, hostname is still Internet-reachable via CF edge — treat as **incomplete security** until 10C.6 |

### Expected layered auth (future)

1. Cloudflare Access (identity) — 10C.6
2. Coolify native authentication — always on
3. Later: raw ports closed — 10C.7+

---

## 11. Credentials and Secrets

### Secret inventory (names only — no values in Git or docs)

| Secret / artifact | Purpose | Storage design |
| --- | --- | --- |
| Tunnel token **or** `credentials.json` | Connector auth | Host only |
| Tunnel UUID / account identifiers | Ops references | Ops vault / encrypted notes — not Git |
| Access service tokens (later) | Automation | Vault; not required for v1 human path |
| `config.yml` (if used) | Ingress config | Host; may be token-only mode without local ingress file if remotely managed |
| Operator recovery references | Break-glass | Offline/secure runbook pointer (no secrets) |

### Rules

| Rule | Requirement |
| --- | --- |
| Git | **No** tokens, JSON credentials, or live tunnel IDs that grant access in repo |
| Docs | **No** secret values; placeholders only |
| File permissions | `600` (or `400` if immutable ops prefer) |
| Owner/group | `root:root` or dedicated `cloudflared:cloudflared` |
| Directory | e.g. `/etc/cloudflared/` mode `700` |
| Backup | Encrypted off-host backup (ops vault / secure store); **not** R2 public docs; not Git |
| Rotation | On suspected leak; on operator offboarding; periodic CAB-scheduled rotation |
| Revocation | Cloudflare Zero Trust → revoke tunnel token / delete connector; rotate immediately |
| Rebuild | Create new token → install on host → validate → revoke old |
| Evidence without disclosure | Record: “token installed”, path, mode bits, tunnel name, connector **healthy**, timestamp — never paste token |

### Break-glass credential model

| Path | Design |
| --- | --- |
| Cloudflare dashboard access | Separate IdP / break-glass admin accounts — **PENDING readiness verification** |
| VPS SSH | Out of this phase; required for systemd recovery |
| Direct `:8000` while still open | Temporary emergency only during transition; must not remain long-term plan |

---

## 12. Network Dependencies

### Required from `cloudflared` (outbound)

| Requirement | Notes |
| --- | --- |
| Outbound to Cloudflare edge | HTTPS / QUIC (UDP 7844 commonly); HTTP/2 fallback if QUIC blocked |
| DNS resolution | System resolvers must resolve CF endpoints |
| No inbound ports required for Tunnel itself | Connector is egress-initiated |

### Docker / host

| Item | Dependency |
| --- | --- |
| Origin `127.0.0.1:8000` | Coolify listening locally |
| Docker network | Not required for recommended systemd + loopback origin |
| Traefik | Not required for Tunnel origin path |

### Relationship to later origin lockdown

| Phase | `:8000` | `:6001`/`:6002` | `:8080` | `:22` | Tunnel |
| --- | --- | --- | --- | --- | --- |
| Now | Open (external) | Open | Open | Open | Absent |
| After Tunnel deploy (transition) | **Still open** | Still open | Still open | Open | Active |
| After Access (10C.6) validated | Still open until lockdown | Still open | Still open | Open | Active + Access |
| After 10C.7+ | External closed / filtered | As designed | As designed | Hardened in 10C.9 | Primary admin path |

### Explicit clarification

**Tunnel alone does not close:**

- `8000`
- `6001`
- `6002`
- `8080`
- `22`

Those remain **residual exposure** until later authorized phases. Documentation and monitoring must track raw-port exposure during transition to avoid false security.

---

## 13. Failure Modes

| Failure | User-visible impact | Detection | Recovery | Rollback | Max recovery (design target) | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `cloudflared` crash | Coolify via Tunnel down; direct ports may still work | systemd failed; CF connector down; monitor probe | Restart unit; check logs | Use direct `:8000` / Traefik hostname while open | 5–15 min | journal + CF status |
| VPS reboot | Temporary admin via Tunnel down until unit starts | Host uptime; connector reconnect | systemd enable; confirm Coolify up | Same direct paths | 15–30 min | boot logs + connector |
| Credential loss | Connector cannot register | CF unauthorized; logs | Restore from vault / new token | Direct ports | 30–60 min | new token evidence (no secret) |
| Cloudflare outage | Tunnel hostname down | CF status; probes fail | Wait / status page; use break-glass direct if ports open | Direct path | Outage-bound | CF status + timestamps |
| DNS failure | Hostname resolve fail | `dig` fail | Fix DNS/NS; temporary IP access if authorized | Restore prior DNS | 15–60 min | dig evidence |
| Access outage (post-10C.6) | Challenge fails | Access errors | CF status; temporary Access bypass **only if CAB** | Disable Access app carefully | 15–60 min | Access logs |
| Coolify failure | Login/UI broken even if Tunnel up | Coolify containers down | Coolify DR procedures | N/A to Tunnel | Per DR RTO | `docker ps` |
| Traefik failure | Portal/API impact; Tunnel to `:8000` may still work | portal/API fail; coolify via tunnel OK | Fix proxy | — | Per DR | proxy logs |
| WebSocket failure | Terminal/realtime broken | UI works, WS fail | Fix ingress/Access WS; verify ports | Temporary direct path | 30–60 min | WS test evidence |
| Incorrect ingress | Wrong service / 404 / portal leak risk | Content mismatch | Fix ingress; catch-all 404 | Disable public hostname route | 15–30 min | curl Host tests |
| Expired/revoked token | Connector offline | CF + logs | Issue new token; revoke old | Direct path | 30–60 min | connector healthy |

### HA note

Multiple `cloudflared` processes on **one** VPS do not create high availability. True HA would require multi-host connectors — **out of current architecture**.

---

## 14. Observability

### Signals to monitor (design — no changes this phase)

| Signal | Method (future) |
| --- | --- |
| `cloudflared` process health | systemd `is-active`; optional monitor check |
| Tunnel connected state | Cloudflare Zero Trust connector status |
| Hostname reachability | HTTPS probe to `coolify.argos-it.com` |
| Access login page | Unauth probe expects Access challenge (post-10C.6) |
| Authenticated Coolify reachability | Controlled synthetic / manual checklist |
| WebSocket functionality | Terminal + realtime manual/scripted test |
| Reconnect loops | Log rate of reconnect / flap alerts |
| DNS correctness | `dig` for `coolify` vs portal/API |
| Raw-port exposure | Periodic external probe of `:8000/:6001/:6002/:8080` during transition |

### Alerts (design)

| Condition | Severity |
| --- | --- |
| Connector disconnected > N minutes | SEV-2 (admin path) |
| Coolify Tunnel HTTPS fail while portal OK | SEV-2 |
| Portal/API fail | SEV-1 (existing DR — not Tunnel-specific) |
| External `:8000` still open after lockdown CAB complete | SEV-2 security debt |
| Reconnect loop storm | SEV-3 / SEV-2 if sustained |

### Integration with `argos-prod-ops`

| Item | Design |
| --- | --- |
| Current monitor | `/root/argos-prod-ops/bin/monitor-production.sh` every 5 min — portal/API/PG/R2 |
| Future addition | Optional checks for Tunnel/Coolify hostname — **no monitor changes in 10C.5** |
| Evidence retention | Monitor logs under `/root/argos-prod-ops/logs/`; retain per existing ops policy |

---

## 15. Deployment Sequence

Future implementation sequence (**not authorized now**). No commands in this phase.

| Step | Action | Mandatory gate before next |
| --- | --- | --- |
| 1 | Preconditions + CAB approval | Written authorization; rollback owner named |
| 2 | Cloudflare zone active + DNS validated (10C.4 impl + cutover as authorized) | Peer diff PASS; portal/API/mail OK |
| 3 | Create Tunnel (Zero Trust) | Tunnel UUID recorded (non-secret ops id) |
| 4 | Store credentials safely on host vault path | mode `600`; backup in vault; **not in Git** |
| 5 | Deploy `cloudflared` (systemd recommended) | Unit enabled; connector **Connected** |
| 6 | Validate internal origin `http://127.0.0.1:8000` | Local curl health; Host header OK |
| 7 | Publish hostname `coolify.argos-it.com` on Tunnel | DNS points to Tunnel; HTTPS reaches Coolify login |
| 8 | Apply Access in **10C.6** | Access challenge + native login both work |
| 9 | Validate WebSocket / terminal / realtime | PASS matrix or document residual gaps |
| 10 | Keep raw ports **open** during transition | External probe still records exposure |
| 11 | Origin lockdown only after complete validation (**10C.7**) | Access+Tunnel+WS PASS; break-glass documented |
| 12 | Evidence package + STOP | Evidence matrix complete; no silent gaps |

### Preconditions checklist (gate for step 1–2)

- [ ] Hostinger panel export complete (DNS migration gate)
- [ ] CF zone staging peer-diff PASS
- [ ] DNSSEC/DS plan executed as required
- [ ] Portal/API baseline green
- [ ] Coolify native auth verified
- [ ] Rollback owner identified
- [ ] Break-glass Cloudflare dashboard access verified
- [ ] Exact Coolify WS/realtime paths verified or explicitly accepted as residual risk

---

## 16. Validation Matrix

### Pre-change baseline (before any Tunnel impl)

| Test | Method | Expected | Evidence | Rollback trigger |
| --- | --- | --- | --- | --- |
| Portal 200 | `GET https://portal.argos-it.com/` | 200 | Status + timestamp | N/A (baseline) |
| API health OK | `GET /api/health` | 200 + OK | Body snippet | N/A |
| TLS portal/API | Handshake / headers posture | Matches 10C.2A PASS baseline | Header capture | N/A |
| Coolify hostname | `https://coolify.argos-it.com` | Login reachable | Screenshot/status | N/A |
| Coolify native login | Interactive | Success | Evidence note | N/A |
| Traefik healthy | `docker ps` coolify-proxy | Up | Output | N/A |
| Coolify healthy | containers coolify* | Up | Output | N/A |
| PostgreSQL healthy | DR checks | healthy + SELECT 1 | Output | N/A |
| Monitoring green | argos-prod-ops log | Cycle OK | Log excerpt | N/A |
| Raw ports recorded | External probe `:8000/:6001/:6002/:8080` | Open (current) | Probe log | N/A |
| DNS | `dig` coolify/portal/api | A → `91.108.121.181` (today) | dig | N/A |

### Future post-change tests (after authorized impl)

| Test | Method | Expected | Evidence | Rollback trigger |
| --- | --- | --- | --- | --- |
| Portal 200 | GET `/` | Unchanged 200 | Capture | Portal regression → stop; fix; if DNS related revert |
| API health OK | GET `/api/health` | Unchanged OK | Capture | API regression → rollback related change |
| TLS portal/API unchanged | Compare headers/TLS | No regression vs 10C.2A | Diff | Header/TLS regression |
| Coolify hostname | HTTPS via Tunnel DNS | Coolify login page | Capture | Hostname fail → revert coolify DNS to A |
| Access challenge | Unauth GET (post-10C.6) | Access page, not open Coolify | Capture | Wrong exposure |
| Coolify native login | After Access | Success | Note | Login fail → Access/Tunnel rollback |
| Dashboard | UI | Loads | Note | UI fail |
| Deploy view | UI | Loads | Note | Fail |
| Logs view | UI | Loads | Note | Fail |
| Terminal | Interactive | Works | Note | Terminal fail → investigate WS; consider rollback |
| WebSocket/realtime | Terminal + live | Works | Note | WS fail |
| Traefik healthy | docker | Up | Output | Traefik down (portal SEV) |
| Coolify healthy | docker | Up | Output | Coolify down |
| PostgreSQL healthy | DR | OK | Output | DB SEV |
| Monitoring green | monitor log | OK | Log | Monitor red |
| Raw port exposure | External probe | Still open in transition; closed only after 10C.7 | Probe | Unexpected early close without validation |
| DNS resolution | dig coolify | Tunnel CNAME/CF path | dig | Wrong target |
| Tunnel connector state | CF + systemd | Connected / active | Status | Disconnected sustained |

---

## 17. Rollback Matrix

Rollback must restore the **current direct Coolify path** while raw ports remain open.

| Scenario | Rollback | Prerequisites | Max time | Evidence after | DNS TTL notes |
| --- | --- | --- | --- | --- | --- |
| cloudflared deploy bad | Stop/disable systemd unit | SSH access | 5–15 min | Unit inactive; direct Coolify OK | None if DNS unchanged |
| Tunnel route wrong | Remove/disable public hostname route in CF | CF dashboard | 5–15 min | Hostname behavior restored | Low if still A record |
| Hostname route DNS wrong | Point `coolify` back to A `91.108.121.181` | DNS auth (CF or Hostinger) | 15–60 min | dig shows A; HTTPS OK | Honor TTL (14400 today → consider pre-lowering under separate auth) |
| Credentials bad | Replace token / stop connector | Vault + CF | 15–30 min | Connector healthy or stopped intentionally | — |
| Access integration fail | Disable Access app (10C.6) **with CAB** | CF Access admin | 15–30 min | Coolify reachable per interim policy | — |
| Origin target wrong | Point ingress back to last known good origin | cloudflared config access | 15–30 min | Local + remote OK | — |
| WebSocket failures | Revert to direct path; keep ports open | SSH + DNS | 15–30 min | Terminal works direct | — |

| Field | Value |
| --- | --- |
| Rollback owner | **PENDIENTE** (must be named before impl) |
| Prefer | DNS/Tunnel/Access rollback over Docker/firewall emergency changes |
| Portal/API | Must remain untouched by Coolify Tunnel rollback |

---

## 18. Risk Matrix

| ID | Risk | Category | Security benefit if done right | Business impact | Availability impact | Recovery complexity | Probability | Severity | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T1 | Tunnel misrouting to wrong origin | Operational | — | High if portal exposed via admin tunnel | High | Medium | Medium | High | Catch-all 404; peer review ingress; never route portal/API |
| T2 | WebSocket/terminal failure | Operational | — | Admin productivity loss | Medium | Medium | Medium | High | PENDING path verification; keep ports open in transition |
| T3 | Coolify UI lockout | Operational / Availability | — | Cannot deploy/recover apps | High | Medium | Medium | Critical | Dual path during transition; break-glass; native auth kept |
| T4 | Credential leakage | Security | Rotation/revocation | High | Medium | Medium | Low–Med | Critical | mode 600; no Git; vault backup; revoke procedure |
| T5 | cloudflared update regression | Operational | — | Admin path down | Medium | Low–Med | Medium | Medium | Pin versions; CAB upgrades |
| T6 | DNS misconfiguration | Operational | — | Admin and/or public impact | High | Medium | Medium | Critical | Change only `coolify`; validate portal/API each step |
| T7 | False sense of security while raw ports open | Security | Tunnel without lockdown is incomplete | High (breach path) | — | — | **High** until 10C.7 | High | Explicit residual exposure tracking; no “done” until lockdown |
| T8 | Single-VPS dependency | Availability | — | Total admin+apps host loss | High | High | Certain (architecture) | High | DR runbook; no fake HA |
| T9 | Cloudflare dependency | Availability | Edge identity/transport | Admin path CF outage | Medium–High | Medium | Low–Med | High | Break-glass direct while ports open; later documented emergency |
| T10 | Coolify-managed tunnel (if chosen wrongly) | Operational | — | Circular failure | High | High | — | Critical | **Rejected** Option C |
| T11 | Access bypass introduced | Security | — | Admin exposed | High | — | Medium if rushed | Critical | 10C.6 forbids path bypasses |
| T12 | Host header / redirect loops | Operational | — | Login broken via Tunnel | Medium | Low | Medium | Medium | Origin validation gate |

---

## 19. Known Unknowns

Nothing below may disappear silently; each requires future verification or operator decision.

| ID | Unknown | Needed from |
| --- | --- | --- |
| U1 | Exact Coolify realtime / WebSocket paths | Host traffic capture / Coolify version docs |
| U2 | Whether terminal WS terminates on `:8000` or needs `:6001`/`:6002` | Host verification |
| U3 | Preferred final cloudflared method after host inspection | Host packaging / Docker policy |
| U4 | Cloudflare Zero Trust organization state | CF dashboard |
| U5 | Active IdPs for Access | CF Zero Trust / 10C.6 |
| U6 | Cloudflare plan level | CF dashboard |
| U7 | Final zone status (staged/active/cut over) | 10C.4 implementation outcome |
| U8 | Credential ownership model (who holds vault) | Operator decision |
| U9 | Provider-console break-glass readiness | CF account + IdP |
| U10 | Raw-port closure sequence details | 10C.7 design |
| U11 | cloudflared → host port vs Docker service (evidence) | Host inspection |
| U12 | Persistence across Coolify upgrades ( empirically) | Post-impl soak |
| U13 | Coolify `APP_URL` / trusted proxies / HTTPS URL generation behind Tunnel | Coolify config review |
| U14 | Exact Coolify version pin | Host |
| U15 | Whether Host header rewrite is required for `127.0.0.1:8000` | Local probe |
| U16 | Production Security Baseline written artifact location | Ops archive (phase PASS, not in repo) |
| U17 | 10C.2A security headers raw evidence archive | Ops archive (phase PASS, not in repo) |
| U18 | Rollback owner identity | CAB |
| U19 | Need for Access service tokens (automation) | Operator decision |
| U20 | QUIC blocked on VPS egress? | Network test at impl time |

---

## 20. Future Phases

```
10C.5  Tunnel Architecture Design          ← this document (DESIGN ONLY)
   ↓
10C.5-IMPL (future auth)  Deploy cloudflared + Tunnel hostname
   ↓
10C.6  Cloudflare Access design + impl     (identity gate; native auth remains)
   ↓
10C.7  Origin lockdown                     (close/filter raw admin ports)
   ↓
10C.8  Firewall hardening
   ↓
10C.9  SSH hardening
```

| Phase | In scope | Out of scope |
| --- | --- | --- |
| 10C.5 | Tunnel design | Install, Access policies, port close |
| 10C.6 | Access apps/policies | Port close |
| 10C.7 | Origin lockdown | SSH redesign |
| 10C.8–10C.9 | Firewall / SSH | DNS redesign |

---

## 21. Final Status

### Design decision summary

| Topic | Decision |
| --- | --- |
| Deployment pattern | **A — systemd `cloudflared`** (B acceptable alternate; C rejected) |
| Origin | **`http://127.0.0.1:8000`** primary |
| Hostname | **`coolify.argos-it.com`** preserved |
| Portal/API | Outside Tunnel/Access |
| Access | Boundary only; policies in 10C.6 |
| HA | Single connector; no fake multi-replica HA on one VPS |
| Ports | Remain open until 10C.7+ |

### Final Decision

**READY FOR DOCUMENT REVIEW**

Rationale: Architecture options compared with a recovery-first recommendation; origin/hostname/ingress/Access-boundary/secrets/network/failure/observability/sequence/validation/rollback/risk sections are complete and aligned with DNS Rev 2, Zone Staging, and DR runbook. Remaining items are explicitly listed as Known Unknowns / implementation gates — they block implementation, not this design review.

---

PHASE 10C.5

CLOUDFLARE TUNNEL ARCHITECTURE DESIGN

Status:
DESIGN CREATED

Implementation Readiness:
NOT AUTHORIZED

Infrastructure Modified:
NO

DNS Modified:
NO

Cloudflare Modified:
NO

Tunnel Created:
NO

Commits:
NO

Push:
NO

Next Authorized Action:
DOCUMENT REVIEW ONLY

STOP.
