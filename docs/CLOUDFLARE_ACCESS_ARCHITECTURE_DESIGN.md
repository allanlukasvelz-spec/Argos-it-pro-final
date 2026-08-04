# Cloudflare Access Architecture and Policy Design — Coolify Admin

## 1. Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Document** | `docs/CLOUDFLARE_ACCESS_ARCHITECTURE_DESIGN.md` |
| **Phase** | **10C.6** |
| **Revision** | 1 |
| **Type** | DESIGN ONLY — NO IMPLEMENTATION |
| **Authoritative inputs** | `docs/CLOUDFLARE_TUNNEL_ARCHITECTURE_DESIGN.md` (10C.5); `docs/CLOUDFLARE_ZONE_STAGING_DESIGN.md`; `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` (Rev 2); `docs/PRODUCTION_DR_RUNBOOK.md` (v1.0); Production Security Baseline (phase PASS); PHASE 10C.2A security headers (phase PASS) |
| **Implementation authorized** | **NO** |
| **Access application authorized** | **NO** |
| **IdP configuration authorized** | **NO** |

### Related phase map

| Phase | Scope | Relation |
| --- | --- | --- |
| 10C.4 | Zone staging | DNS authority preferred before Tunnel hostname |
| 10C.5 | Tunnel architecture | Private transport; Access sits in front |
| **10C.6** | Access architecture + policy design | This document |
| 10C.7 | Origin lockdown | Only after Tunnel + Access + WS validation |
| 10C.8 / 10C.9 | Firewall / SSH hardening | After lockdown baseline |

---

## 2. Authority and non-authorization notice

This document is **design and documentation only**.

It does **not** authorize:

- creation of Cloudflare Access applications or policies;
- IdP / identity provider configuration;
- MFA enrollment changes in any provider;
- Tunnel creation or `cloudflared` install;
- DNS, nameserver, Hostinger, or Cloudflare zone changes;
- closing ports `8000`, `6001`, `6002`, `8080`, or `22`;
- firewall or SSH changes;
- Coolify, Docker, Traefik, or portal/API changes;
- commits or pushes as operational cutover work.

No infrastructure was modified by producing this document.

**No personal emails, passwords, tokens, or live Access policy IDs appear in this document.** Administrator roster slots are placeholders pending operator fill-in.

---

## 3. Executive Summary

PHASE 10C.6 designs the **identity gate** for Coolify administrative access so operators can authenticate from **changing networks** without static IP allowlists, while keeping Coolify **native login** as a second layer.

**Target control plane (future, not implemented):**

```
Operator (any network)
  → Cloudflare Access (identity + MFA)     ← this phase’s design
  → Cloudflare Tunnel (10C.5)
  → http://127.0.0.1:8000 Coolify
  → Coolify native login (always on)
```

**Protected surface (only):**

| Hostname | Access | Tunnel | Public |
| --- | --- | --- | --- |
| `coolify.argos-it.com` | **Yes** | Yes | No (admin) |
| `portal.argos-it.com` | **No** | No | Yes |
| `api.portal.argos-it.com` | **No** | No | Yes |
| `staging.argos-it.com` | **No** (unless separate CAB) | No | As today |

**Design decisions (summary):**

| Topic | Decision |
| --- | --- |
| Primary identity | Named allowlist of admin emails via chosen IdP (see §5) |
| MFA | **Mandatory** for all Access allow decisions |
| Default posture | **Deny all** except explicit Allow emails/groups |
| Path bypasses | **Forbidden** (including `/terminal`, WS, realtime) |
| IP allowlists | **Not** the primary control (defeats multi-network ops) |
| Service tokens (v1) | **Not** for human admin path; automation optional later |
| Sessions | Short Access session + independent Coolify session |
| Emergency | Documented break-glass; CAB required to disable Access |
| Port closure | **Not** in 10C.6 — residual exposure until 10C.7+ |

**Hard dependency:** Access on the Tunnel-published hostname is incomplete until Tunnel (10C.5-IMPL) is live. Access alone on classic A→origin without Tunnel does not remove raw-port exposure. **Access + Tunnel ≠ port lockdown.**

---

## 4. Current State

| Item | Status |
| --- | --- |
| DNS authority | Hostinger parking NS |
| Cloudflare zone | Not staged / not active |
| Tunnel / `cloudflared` | Not installed |
| Access application | Not created |
| IdP for Zero Trust | **UNKNOWN** — requires dashboard verification |
| Coolify admin paths | `coolify.argos-it.com`, `:8000`, `:6001`, `:6002` |
| Traefik publish | `:8080` |
| Portal / API | Must stay public |
| Coolify native auth | Must remain enabled |
| SSH / firewall / port close | Outside this phase |
| DR owners | Many roles still **PENDIENTE** in runbook |

### Security layering truth

| Layer | Now | After 10C.6 impl | After 10C.7+ |
| --- | --- | --- | --- |
| Network / DNS to Coolify | Public | Tunnel hostname + Access | Same |
| Identity (Access) | Absent | Required | Required |
| Coolify native auth | On | On | On |
| Raw ports external | Open | **Still open** | Closed/filtered |

Enabling Access while `:8000`/`:6001`/`:6002` remain open leaves a **bypass path**. That residual risk must stay visible until origin lockdown.

---

## 5. Identity Architecture

### 5.1 Goals

- Authenticate a **small, named** set of Coolify administrators.
- Work from **changing networks** (no static IP allowlist as primary control).
- Enforce **MFA** on every Access grant.
- Avoid coupling Access to Coolify user store (Coolify login remains separate).
- Keep portal/API identity completely separate (public apps).

### 5.2 Identity options evaluated

| Option | Description | Pros | Cons | Fit |
| --- | --- | --- | --- | --- |
| **I1 — Cloudflare One-Time PIN (email OTP)** | Allow specific emails; CF emails OTP | No corporate IdP required; fast for tiny admin set; MFA-by-design (OTP) | Email delivery dependency; mailbox compromise risk | Strong for small roster |
| **I2 — Google** | Google IdP + Google MFA | Familiar; strong MFA if enforced | Requires Google accounts; IdP admin overhead | Strong if team already on Google |
| **I3 — Microsoft Entra ID** | Entra + Conditional Access MFA | Enterprise controls | Requires tenant; overkill if unused | Only if tenant already exists |
| **I4 — GitHub / other OIDC** | Dev IdP | Convenient for git-centric teams | Org membership sprawl; weaker admin boundary if not locked | Secondary only |
| **I5 — IP allowlist only** | Allow by source IP | Simple | **Fails** multi-network requirement | **Rejected** as primary |
| **I6 — Access Service Token only** | Machine tokens | Good for automation | Not for interactive humans | v1 human path **Rejected**; optional later for CI |

### 5.3 Recommended primary identity method

**Recommendation (design):**

1. **Primary IdP for human admins:**  
   - **Preferred if already in use:** Google (I2) or Microsoft Entra (I3) with **org-enforced MFA**.  
   - **Preferred if no corporate IdP:** Cloudflare **One-Time PIN** to explicitly allowlisted emails (I1).

2. **MFA:**  
   - **Mandatory.**  
   - With I2/I3: rely on IdP MFA **and** verify it is enforced for every allowlisted account (no MFA-exempt admins).  
   - With I1: OTP email is the MFA factor; protect mailboxes (account MFA on email provider).

3. **Do not** use IP allowlists as the sole or primary Allow rule.

4. **Do not** use “Everyone” / “Accept all” / path Bypass rules.

**Final IdP selection remains OPERATOR DECISION** pending Cloudflare Zero Trust dashboard inspection (Known Unknown U1).

### 5.4 Identity decision record (to complete before impl)

| Field | Design requirement | Status |
| --- | --- | --- |
| Chosen IdP | I1 / I2 / I3 (one primary) | **PENDIENTE** |
| MFA enforcement evidence | Screenshot/policy export (no secrets) | **PENDIENTE** |
| Fallback IdP | Optional secondary for break-glass identity | **PENDIENTE** |
| Email domain restrictions | If I2/I3, restrict to org domain where possible | **PENDIENTE** |

---

## 6. Administrator Roster Design

### 6.1 Principles

- Explicit **allowlist** only — no open registration.
- Least privilege: Coolify Access grant ≠ Cloudflare account Super Admin.
- Separate **Access admin users** (can reach Coolify hostname) from **Cloudflare dashboard break-glass admins**.
- Roster lives in ops vault / CAB record — **not** committed with real emails unless operator explicitly requests later.
- Offboarding must revoke Access **and** Coolify local user **and** (if any) dashboard roles.

### 6.2 Role classes

| Role class | Purpose | Access app Allow? | Cloudflare dashboard? | Coolify native user? |
| --- | --- | --- | --- | --- |
| **Coolify Operator** | Day-to-day deploys, logs, terminal | Yes | No (default) | Yes |
| **Coolify Lead / SRE** | Same + incident response | Yes | Optional read | Yes |
| **Incident Commander** | CAB / emergency Access disable | Yes (recommended) | Break-glass capable | Yes or coordinated |
| **Cloudflare Break-glass** | Disable Access / fix Tunnel if locked out | May or may not need Coolify Access | **Yes — separate** | Optional |
| **Portal end users** | Use portal/API | **No** | No | No |
| **Automation / CI** | Future machine access | Service token later — **not v1** | No | App tokens if any |

### 6.3 Roster template (fill before implementation — no real emails here)

| Slot ID | Role class | Display name | Email (ops vault) | IdP subject | MFA verified | Coolify local user | Status | Offboard owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Coolify Lead / SRE | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | Planned | **PENDIENTE** |
| A2 | Coolify Operator | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | Optional | **PENDIENTE** |
| A3 | Incident Commander | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | Planned | **PENDIENTE** |
| BG1 | Cloudflare Break-glass | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | N/A or separate | Planned | **PENDIENTE** |
| BG2 | Cloudflare Break-glass (backup) | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | **PENDIENTE** | N/A | Planned | **PENDIENTE** |

**Rule:** Implementation of Access Allow policy is **blocked** until A1 + BG1 are named and MFA-verified in the ops vault.

### 6.4 Group vs individual emails

| Pattern | Recommendation |
| --- | --- |
| Individual emails in Access Allow | **Preferred for v1** (auditable, least surprise) |
| IdP group (e.g. `coolify-admins@`)| Acceptable if group membership is tightly controlled and reviewed |
| Shared mailbox as Allow identity | **Discouraged** (no individual accountability) |

---

## 7. Access Application Design

### 7.1 Application definition (conceptual)

| Field | Design value |
| --- | --- |
| Application name | `argos-coolify-admin` (or equivalent clear name) |
| Application type | Self-hosted / hostname-based Access app |
| Public hostname | `coolify.argos-it.com` |
| Corridor | Cloudflare Tunnel published hostname (per 10C.5) |
| Session affinity | Browser Access session cookie for that app |
| Identity providers enabled | Only the chosen primary (+ optional break-glass IdP) |
| CORS / app launcher | Not required for v1 Coolify admin |

### 7.2 Explicit non-applications

Do **not** create Access applications for:

- `portal.argos-it.com`
- `api.portal.argos-it.com`
- apex / www / mail hostnames
- raw IP:port URLs (cannot be “fixed” by Access; must be closed in 10C.7)

---

## 8. Policy Design — Allow and Deny

### 8.1 Policy posture

| Rule | Design |
| --- | --- |
| Default | Implicit **deny** (no match → no access) |
| Order | Specific Allow for admins; optional explicit Deny for known bad actors; **no** Bypass |
| Purpose justification | Required on every Allow rule in CAB notes |

### 8.2 Allow policy (human admins)

| Element | Design |
| --- | --- |
| Policy name | `allow-coolify-operators` |
| Action | Allow |
| Include | Emails in roster slots A* (or IdP group mapped 1:1 to roster) |
| Require | MFA (IdP MFA or OTP per §5) |
| Exclude | None required for v1 |
| Device posture | Optional later — **not** blocking for v1 (changing networks / personal ops devices likely) |
| Country / IP Include | **Not required**; must not be the only Include |
| Duration | See §9 Sessions |

### 8.3 Deny policy

| Element | Design |
| --- | --- |
| Policy name | `deny-all-others` (explicit optional) |
| Action | Deny |
| Include | Everyone (if platform requires explicit deny) **or** rely on default deny |
| Notes | Prefer platform default deny + tight Allow; add explicit Deny only if needed for clarity/audit |

### 8.4 Forbidden policies

| Policy type | Status | Reason |
| --- | --- | --- |
| Bypass for `/` | **Forbidden** | Exposes Coolify login to Internet via edge |
| Bypass for `/terminal` or `/terminal/ws` | **Forbidden** | Terminal is highest privilege surface |
| Bypass for realtime / WS paths | **Forbidden** | Same as terminal risk |
| Allow Everyone | **Forbidden** | Defeats Access |
| Allow by IP only | **Forbidden** as primary | Breaks multi-network ops; false safety |
| Service Auth bypass for humans | **Forbidden** | Tokens are for machines only |

### 8.5 Service tokens (future, not v1 human path)

| Use case | Design |
| --- | --- |
| Human browser access | **No** service token |
| Future CI → Coolify API | Separate CAB; scoped token; short TTL; vault storage; never in Git |
| Monitoring probes | Prefer unauthenticated expectation = Access challenge page; do not punch Bypass for monitors |

---

## 9. Session Design

### 9.1 Two independent sessions

| Session | Owner | Purpose |
| --- | --- | --- |
| **Access session** | Cloudflare Access | Proves identity at edge before origin |
| **Coolify session** | Coolify app | Native application authorization |

Both must succeed for normal admin work. Losing either should deny effective admin capability (except break-glass paths).

### 9.2 Access session parameters (design targets)

| Parameter | Design target | Rationale |
| --- | --- | --- |
| Access session duration | **8–24 hours** (pick one at impl; default design **12 hours**) | Balance ops friction vs stolen-cookie window |
| Idle timeout | Prefer enabled if available on plan | Reduce abandoned sessions |
| Re-auth on sensitive | If supported, require re-auth for policy edits in CF dashboard (dashboard ≠ app) | Separate concern |
| App token / JWT to origin | Standard Access identity headers to origin optional | Coolify may ignore; do not disable native login because headers exist |

### 9.3 Coolify session

| Parameter | Design |
| --- | --- |
| Native login | **Always required** after Access |
| Session length | Per Coolify defaults / existing prod settings — do not weaken for Access |
| Logout | Logging out of Coolify must not be assumed to clear Access; operators may need Access logout / cookie clear for full de-auth |

### 9.4 Session failure modes

| Failure | Expected UX |
| --- | --- |
| Access session expired | New Access challenge (OTP/IdP) |
| Coolify session expired | Coolify login page **behind** Access (already authenticated to Access) |
| Access revoked mid-session | Subsequent requests fail Access; WS should drop |
| Shared browser | Discouraged; each admin uses own profile |

### 9.5 Cookie coexistence (validation required)

| Risk | Mitigation |
| --- | --- |
| Cookie name collision | Validate Coolify still sets/reads its cookies behind Access |
| `SameSite` / secure flags | Validate login + WS after Access enable |
| Multiple admins same browser | Operationally forbidden |

Mark full cookie matrix as **PENDING VERIFICATION** at implementation soak.

---

## 10. WebSockets, Realtime, and Terminal

### 10.1 Design rules

1. **One Access application** covers all paths on `coolify.argos-it.com`.
2. **No path-based Bypass** for terminal or realtime.
3. After Access auth, WebSocket upgrades must succeed for terminal and live views.
4. Exact Coolify paths remain **PENDING VERIFICATION** (from 10C.5 U1/U2).

### 10.2 Path handling (verification status)

| Traffic | Access treatment | Status |
| --- | --- | --- |
| `/` UI | Protected by app Allow | Expected |
| `/app` | Protected (no bypass) | **PENDING VERIFICATION** existence |
| `/terminal` | Protected (no bypass) | **PENDING VERIFICATION** |
| `/terminal/ws` | Protected; WS upgrade allowed post-auth | **PENDING VERIFICATION** |
| Realtime via `:6001`/`:6002` through UI origin | Same Access session | **PENDING VERIFICATION** |
| Direct browser to `https://IP:6001` | **Not** covered by Access hostname | Residual risk until 10C.7 |

### 10.3 Validation requirements before declaring Access “done”

| Check | Pass criteria |
| --- | --- |
| Unauth HTTPS to Coolify host | Access challenge only |
| Auth + Coolify login | Dashboard loads |
| Terminal open | Interactive shell works |
| Deploy logs / realtime | Live updates work |
| WS drop on Access revoke | Connection ends within acceptable time |

If terminal/realtime fail **only** behind Access but work on direct `:8000`, treat as **Access/Tunnel WS defect** — do **not** “fix” with Bypass.

### 10.4 Relationship to raw realtime ports

Access on the hostname does **not** protect naked `:6001`/`:6002`. Those remain emergency/residual exposure until 10C.7 closes them.

---

## 11. Emergency / Break-glass Access

### 11.1 Scenarios

| Scenario | Primary recovery | Secondary |
| --- | --- | --- |
| Access misconfiguration lockout | Cloudflare dashboard break-glass admin disables/fixes Access policy | Direct `:8000` **only while still open** (transition) |
| IdP / OTP email outage | Secondary IdP or break-glass CF admin | Direct port / SSH per later phases |
| Tunnel down | Fix `cloudflared` via SSH; Access irrelevant until Tunnel up | Direct port while open |
| Cloudflare platform outage | Wait; use direct port if CAB allows during transition | After 10C.7, documented SEV path without raw ports |
| Stolen admin laptop | Revoke Access Allow + Coolify password + sessions | Rotate IdP credentials |

### 11.2 Break-glass rules

| Rule | Design |
| --- | --- |
| Disable Access | **CAB / dual authorization** (align with DR dual-auth culture) |
| Duration | Temporary; ticket with end time; re-enable ASAP |
| Evidence | Who, why, start/end UTC, ticket ID — no secrets |
| Path Bypass as break-glass | **Forbidden** even in emergency — prefer disable app or Allow temporary named break-glass user |
| Long-term “emergency Bypass” left enabled | **Forbidden** |
| Post-10C.7 | Direct `:8000` may be closed — break-glass must not depend on it forever; SSH + CF dashboard become critical (10C.9) |

### 11.3 Break-glass inventory (design)

| Asset | Requirement | Status |
| --- | --- | --- |
| BG1 / BG2 Cloudflare dashboard admins | MFA-enforced; stored offline procedure | **PENDIENTE** |
| Ops vault Access restore notes | How to re-enable Allow policy | **PENDIENTE** |
| SSH break-glass | Out of 10C.6; required before port close | 10C.9 dependency |
| Direct port use | Allowed only pre-lockdown + CAB | Transition only |

---

## 12. Dependency on Tunnel and Port Closure

### 12.1 Dependency graph

```
DNS zone active (10C.4 impl / cutover as authorized)
    ↓
Tunnel + cloudflared + coolify hostname on Tunnel (10C.5 impl)
    ↓
Access application + Allow/Deny + MFA (10C.6 impl)   ← this design
    ↓
Validation: Access + native login + terminal/WS PASS
    ↓
Origin lockdown close/filter :8000 :6001 :6002 (:8080 as designed)  ← 10C.7
    ↓
Firewall hardening 10C.8 → SSH hardening 10C.9
```

### 12.2 What Access depends on

| Dependency | Why |
| --- | --- |
| Tunnel-published `coolify.argos-it.com` | Preferred private origin path (10C.5) |
| Working IdP / OTP | Allow policy cannot authenticate |
| Named roster | Empty allowlist = lockout or temptation to open Allow |
| Coolify native auth still on | Defense in depth |

### 12.3 What must NOT wait on Access

| Item | Reason |
| --- | --- |
| Portal / API availability | Not behind Access |
| Mail / apex DNS | Unrelated |
| R2 backups | Independent |

### 12.4 Port closure gate (10C.7 entry criteria from Access perspective)

Do **not** enter origin lockdown until:

1. Access challenge verified for unauthenticated clients.
2. All roster admins can complete Access + Coolify login.
3. Terminal + realtime PASS behind Access (or residual gaps explicitly accepted by CAB with ticket).
4. Break-glass CF dashboard path tested (disable/re-enable in controlled window **or** dry-run procedure reviewed).
5. External probes still document raw-port exposure (honest residual risk) until closed.
6. Rollback owner named.

---

## 13. Deployment Sequence Design (future — not authorized)

| Step | Action | Gate before next |
| --- | --- | --- |
| 1 | CAB approval + roster A1/BG1 filled + IdP chosen | Written auth |
| 2 | Confirm Tunnel hostname healthy (10C.5-IMPL done) | Connector connected; Coolify via Tunnel without Access still reachable (transition) |
| 3 | Configure IdP / OTP in Zero Trust | Test login on non-prod policy if available; else carefully on app |
| 4 | Create Access application for `coolify.argos-it.com` | App exists; **not** yet enforcing if staged — follow CF safe rollout |
| 5 | Attach Allow policy (roster) + MFA require; default deny | Policy peer-reviewed |
| 6 | Enable enforcement | Unauth sees Access challenge |
| 7 | Validate matrix (§15) including WS/terminal | PASS or rollback |
| 8 | Keep raw ports open | Probe evidence retained |
| 9 | Only then schedule 10C.7 lockdown | Gates in §12.4 |
| 10 | Evidence package + STOP | No silent gaps |

**No commands in this phase. No Access creation now.**

---

## 14. Observability and Audit

| Signal | Purpose |
| --- | --- |
| Access login success/failure logs | Auth audit |
| Policy change audit | Who changed Allow |
| Unauth probe → Access page | Continuous exposure check |
| Auth + Coolify reachability | Admin path health |
| WS/terminal manual checks | Functional admin capability |
| External `:8000` probe | Residual bypass tracking until 10C.7 |
| `argos-prod-ops` | Remains portal/API/PG focused; optional future Access check — **no monitor changes in this phase** |

Alert design (future): sustained Access failures for all admins = SEV-2 admin path; portal/API failures remain SEV-1 per DR.

---

## 15. Validation Matrix

### Pre-Access baseline (before Access enforcement)

| Test | Method | Expected | Evidence | Rollback trigger |
| --- | --- | --- | --- | --- |
| Portal 200 | GET `/` | 200 | Capture | N/A baseline |
| API health | GET `/api/health` | OK | Capture | N/A |
| TLS / headers | Compare to 10C.2A | No regression | Capture | N/A |
| Coolify via Tunnel (if already up) | HTTPS | Coolify login visible | Capture | Fix Tunnel first |
| Raw ports recorded | External probe | Open | Log | N/A |

### Post-Access enforcement (future)

| Test | Method | Expected | Evidence | Rollback trigger |
| --- | --- | --- | --- | --- |
| Unauth Coolify host | GET without cookies | Access challenge only | Capture | Coolify login visible → Access not enforcing → fix/rollback |
| Access login (each A* admin) | IdP/OTP | Success | Note (no secrets) | Any admin fail → fix roster/IdP |
| Coolify native login | After Access | Success | Note | Fail → investigate cookies; rollback Access if locked |
| Dashboard | UI | Loads | Note | Fail |
| Deploy view | UI | Loads | Note | Fail |
| Logs view | UI | Loads | Note | Fail |
| Terminal | Interactive | Works | Note | Fail → **no Bypass**; rollback or fix WS |
| WebSocket/realtime | Live UI | Works | Note | Fail → same |
| Portal 200 | GET | Unchanged | Capture | Regression → stop; unrelated rollback |
| API health | GET | Unchanged | Capture | Regression |
| Deny non-roster identity | Attempt login as non-admin test account | Denied | Note | Accidental Allow Everyone → immediate rollback |
| Access revoke mid-session | Remove test user | Access denied after | Note | Sessions linger beyond policy — investigate |
| Raw ports still open (transition) | Probe | Open | Log | Unexpected close without 10C.7 CAB |
| Break-glass procedure | Dry-run or controlled | Can restore Access config via CF dashboard | Checklist | Cannot recover → do not proceed to 10C.7 |

---

## 16. Rollback Matrix

Rollback must restore admin reachability **without** closing security holes via Bypass.

| Scenario | Rollback | Prerequisites | Max time | Evidence after |
| --- | --- | --- | --- | --- |
| Access policy too tight (lockout) | Break-glass CF admin widens Allow to known good roster **or** temporarily disables Access app (CAB) | BG1 access; CAB | 15–30 min | Admins can login; ticket open |
| Access blocks WS/terminal | Disable Access app (CAB) while investigating; keep Tunnel | CAB; ports still open | 15–30 min | Terminal works; **no** path Bypass left behind |
| IdP outage | Disable Access (CAB) or switch to backup IdP if pre-staged | CAB | 15–60 min | Admin path restored |
| Wrong hostname protected | Remove Access from wrong host immediately | CF admin | 5–15 min | Portal/API unaffected proof |
| Portal/API accidentally behind Access | **Emergency:** remove those apps from Access instantly | CF admin | 5–15 min | Portal 200 / API OK |
| Full Access removal | Disable/delete Access app on `coolify` only | CAB | 15–30 min | Coolify via Tunnel or direct as designed pre-Access |

| Field | Value |
| --- | --- |
| Rollback owner | **PENDIENTE** (name before impl) |
| DNS TTL | Access rollback usually needs **no** DNS change if Tunnel hostname unchanged |
| Forbidden rollback | Leaving Bypass rules enabled “temporarily” without expiry + ticket |

---

## 17. Risk Matrix

| ID | Risk | Operational | Security benefit if correct | Business | Availability | Recovery | Probability | Severity | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Lockout of all Coolify admins | High | — | High | High | Medium | Medium | Critical | BG1/BG2; dual auth to disable; ports open in transition |
| A2 | Path Bypass for terminal | — | Destroys model | High | — | — | Medium if rushed | Critical | Forbidden policies §8.4 |
| A3 | Access without port lockdown | — | Incomplete | High (false safety) | — | — | **Certain** until 10C.7 | High | Explicit residual exposure; gate 10C.7 |
| A4 | IdP/OTP failure | High | — | Medium | Medium | Medium | Low–Med | High | Backup IdP; break-glass |
| A5 | Cookie/session clash | Medium | — | Medium | Medium | Low | Medium | Medium | Validation matrix; soak |
| A6 | WS failure behind Access | Medium | — | Medium | Medium | Medium | Medium | High | No Bypass; rollback Access |
| A7 | Over-broad Allow (Everyone) | — | None | Critical | — | Low | Low–Med | Critical | Peer review; deny test |
| A8 | Portal/API put behind Access | High | Wrong target | Critical | Critical | Low | Low | Critical | Explicit non-apps §7.2 |
| A9 | Shared admin mailbox | Medium | Weak accountability | Medium | — | — | Medium | Medium | Individual emails |
| A10 | Service token sprawl | Medium | — | Medium | — | Medium | Medium later | High | No tokens in v1 human path |
| A11 | Cloudflare dependency | Medium | Edge identity | Medium | Medium–High | Medium | Low–Med | High | Break-glass; transition ports; later SSH |
| A12 | Roster not maintained | Medium | Stale access | High | — | Low | High if ignored | High | Offboard checklist; quarterly review |

---

## 18. Known Unknowns

| ID | Unknown | Blocks |
| --- | --- | --- |
| U1 | Active Zero Trust IdPs / plan features | IdP choice finalization |
| U2 | Whether Google/Entra already available to operators | I2/I3 vs I1 |
| U3 | Final named admin emails (roster) | Allow policy impl |
| U4 | MFA enforcement proof per admin | Allow policy impl |
| U5 | Exact Coolify terminal/WS/realtime paths | WS validation completeness |
| U6 | Cookie behavior Coolify ↔ Access on this version | Session soak |
| U7 | Tunnel hostname live status | Access enforcement sequencing |
| U8 | Break-glass CF admin readiness | 10C.7 entry |
| U9 | Rollback owner identity | Impl CAB |
| U10 | Need for CI service tokens | Later automation design |
| U11 | Access session duration final pick (8 vs 12 vs 24h) | Operator preference |
| U12 | Device posture usefulness on ops devices | Optional hardening |
| U13 | Email OTP deliverability to admin mailboxes | If I1 chosen |
| U14 | Production Security Baseline written archive location | Cross-check |
| U15 | Whether Coolify respects Access identity headers (optional) | Nice-to-have audit |

Nothing above may be silently dropped.

---

## 19. Future Phases

```
10C.6  Access Architecture & Policy Design     ← this document
   ↓
10C.6-IMPL (future auth)  IdP + Access app + policies
   ↓
Validation soak (WS/terminal/roster)
   ↓
10C.7  Origin Lockdown                         (close raw admin ports)
   ↓
10C.8  Firewall Hardening
   ↓
10C.9  SSH Hardening
```

| Phase | Access-related expectation |
| --- | --- |
| 10C.6 design | Complete (this doc) |
| 10C.6 impl | Enforce Access; ports still open |
| 10C.7 | Remove residual bypass via ports |
| 10C.8–9 | Reduce reliance on “open port break-glass” |

---

## 20. Final Status

### Decision summary

| Topic | Decision |
| --- | --- |
| Protected host | `coolify.argos-it.com` only |
| Portal/API | No Access |
| Identity | Allowlisted admins; IdP I1 or I2/I3 per ops; **MFA mandatory** |
| IP allowlist | Not primary |
| Policies | Allow roster + default deny; **no Bypass** |
| Native Coolify auth | Remains enabled |
| Sessions | Access 12h design target + Coolify independent |
| WS/terminal | Same app; no path bypass; verify before done |
| Emergency | CF break-glass + CAB disable; no permanent Bypass |
| Ports | Remain open until 10C.7 |

### Final Decision

**READY FOR DOCUMENT REVIEW**

Rationale: Identity options, MFA requirement, roster template, Allow/Deny posture, session model, WS/terminal rules, break-glass, Tunnel/port-closure dependency, validation, rollback, and risks are complete and aligned with 10C.5. Remaining gaps are operator/IdP/roster unknowns that correctly block **implementation**, not this design review.

---

PHASE 10C.6

CLOUDFLARE ACCESS ARCHITECTURE AND POLICY DESIGN

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

Access Application Created:  
NO

IdP Modified:  
NO

Tunnel Created:  
NO

Ports Closed:  
NO

Commits:  
NO

Push:  
NO

Next Authorized Action:  
DOCUMENT REVIEW ONLY

STOP.
