# Cloudflare Access Policy Design — Coolify Admin

## 1. Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Document** | `docs/CLOUDFLARE_ACCESS_POLICY_DESIGN.md` |
| **Phase** | **10C.6** |
| **Revision** | 1 |
| **Type** | DESIGN ONLY — NO IMPLEMENTATION |
| **Related design** | `docs/CLOUDFLARE_ACCESS_ARCHITECTURE_DESIGN.md` (companion draft; this file is the authoritative 10C.6 policy deliverable named by phase mandate) |
| **Authoritative inputs** | `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` (Rev 2); `docs/CLOUDFLARE_ZONE_STAGING_DESIGN.md`; `docs/CLOUDFLARE_TUNNEL_ARCHITECTURE_DESIGN.md` (10C.5); `docs/PRODUCTION_DR_RUNBOOK.md` (v1.0); Production Security Baseline (phase PASS); PHASE 10C.2A Security Headers (phase PASS) |
| **Implementation authorized** | **NO** |
| **Access application authorized** | **NO** |
| **Access policies authorized** | **NO** |
| **IdP configuration authorized** | **NO** |
| **Service tokens / WARP / Gateway** | **NOT** in scope; not authorized |

---

## 2. Authority and Non-Authorization Notice

This document is **design and documentation only**.

It does **not** authorize:

- creation of Cloudflare Access applications or policies;
- creation of service tokens;
- enabling WARP or Gateway;
- IdP configuration or MFA enrollment changes;
- Tunnel creation or `cloudflared` install;
- DNS, Hostinger, Cloudflare zone, Docker, Traefik, Coolify, firewall, or SSH changes;
- closing ports `8000`, `6001`, `6002`, `8080`, or `22`;
- deploys, commits, or pushes as operational cutover work.

No infrastructure was modified by producing this document.

**No real identities, emails, passwords, tokens, or Access UUIDs appear in this document.** The administrator roster remains **PENDING**.

---

## 3. Executive Summary

PHASE 10C.6 designs production-grade **Cloudflare Access** as the identity gate for Coolify administration, so operators can authenticate from **changing networks** without static IP allowlists, while Coolify **native authentication remains enabled**.

**Future control plane (not implemented):**

```
Operator (any network)
  → Cloudflare Access (primary IdP + mandatory MFA)
  → Cloudflare Tunnel (10C.5 architecture)
  → http://127.0.0.1:8000 Coolify
  → Coolify native login (always on)
```

| Decision | Choice |
| --- | --- |
| Protected hostname | `coolify.argos-it.com` only |
| Portal / API | Public — **no** Access |
| Primary IdP | **Email OTP (Cloudflare One-Time PIN)** — see §6 |
| Emergency fallback IdP | **Google** (if available) **or** second OTP-capable break-glass identity — see §6 |
| MFA | **Mandatory** — do not weaken |
| Policy posture | Explicit Allow roster + **default deny**; **no permanent Bypass** |
| Tunnel relationship | Access sits in front of Tunnel-published hostname |
| Port lockdown | Deferred to **10C.7** — Access alone does not close raw ports |

**Final Decision:** see §19.

---

## 4. Current State

| Item | Status |
| --- | --- |
| Authoritative DNS | Hostinger parking NS |
| Cloudflare zone | Not yet active |
| Tunnel | **NOT** deployed |
| `cloudflared` | Not installed |
| Cloudflare Access | **NOT** configured |
| Access application UUID | N/A (none) |
| Portal / API | Public; must remain public |
| Coolify | Directly reachable (`coolify.argos-it.com`, `:8000`, realtime `:6001`/`:6002`) |
| Traefik publish | `:8080` open |
| SSH / firewall | Unchanged |
| Origin lockdown | Deferred (10C.7) |
| Tunnel architecture (10C.5) | Designed / approved for review — not implemented |
| Coolify native auth | Enabled — must remain enabled |
| Administrator roster | **PENDING** |
| Final IdP selection evidence | **PENDING** (design recommendation below; tenant state unverified) |

**Residual exposure truth:** Access on the hostname does **not** protect naked `:8000` / `:6001` / `:6002` / `:8080`. Those remain open until 10C.7+.

---

## 5. Access Boundary

### 5.1 Hostname classification

| Class | Hostname(s) | Access | Tunnel (10C.5) | Notes |
| --- | --- | --- | --- | --- |
| **Protected** | `coolify.argos-it.com` | **Yes** | Yes (future) | Sole Access application target |
| **Public** | `portal.argos-it.com` | **No** | No | Must stay publicly reachable |
| **Public** | `api.portal.argos-it.com` | **No** | No | Health and API public |
| **Excluded** | apex / `www` / mail / DKIM / autoconfig | **No** | No | Hostinger / mail surfaces |
| **Excluded (default)** | `staging.argos-it.com` | **No** | No | Unless separate CAB later |
| **Not protectable by Access hostname** | `http(s)://<IP>:8000`, `:6001`, `:6002`, `:8080` | N/A | N/A | Origin lockdown (10C.7) |

### 5.2 Which requests shall traverse Access

When Access is enforced on the Tunnel-published Coolify hostname, **all** of the following for `https://coolify.argos-it.com/*` shall hit Access **before** origin:

| Request class | Traverses Access? |
| --- | --- |
| Browser navigation to Coolify UI | **Yes** |
| Coolify SPA assets under that host | **Yes** |
| Terminal UI and terminal WebSocket on that host | **Yes** |
| Realtime / live event traffic on that host | **Yes** |
| Unauthenticated probes | **Yes** → Access challenge (not Coolify login) |
| Portal / API requests | **No** |
| Direct IP:port to VPS | **No** (residual until 10C.7) |
| SSH | **No** (10C.9) |

### 5.3 Relationship map

| Relationship | Design rule |
| --- | --- |
| **Tunnel** | Tunnel = private transport to `http://127.0.0.1:8000`. Access = identity gate **in front of** the public Tunnel hostname. Prefer Tunnel live before Access enforcement. |
| **Native Coolify login** | **Always on.** Access does not replace it. Operators complete Access, then Coolify login. |
| **Future firewall lockdown (10C.8)** | Complements Access; does not replace identity. Sequence: Access validated → origin port close (10C.7) → broader firewall (10C.8). |
| **Origin protection (10C.7)** | Closes raw admin ports that bypass Access. Access without 10C.7 = incomplete. |
| **Portal / API** | Outside Access and outside Coolify admin Tunnel path. Continuity is a hard constraint. |

### 5.4 Layered auth (future)

1. Cloudflare Access (identity + MFA)  
2. Coolify native authentication  
3. Origin/port lockdown (10C.7+)  

---

## 6. Identity Model

### 6.1 Provider evaluation

| Provider | Advantages | Disadvantages | Operational dependency | Recovery | MFA capability | Lifecycle | Admin effort | ZT compatibility |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Cloudflare native / Email OTP (One-Time PIN)** | No corporate IdP required; MFA-by-design; tiny roster friendly; multi-network OK | Email delivery; mailbox compromise; no central HR offboard hook | Cloudflare + admin mailboxes | Re-issue OTP; protect mailbox | Strong (OTP) | Add/remove emails in Access Allow | Low | Native |
| **Google Workspace** | Strong org MFA; familiar; groupable | Needs Workspace; domain admin | Google tenant | Google account recovery | Strong if enforced | Group membership | Medium | Excellent |
| **Microsoft Entra ID** | Enterprise CA/MFA; groups | Needs tenant; heavier | Entra tenant | Entra recovery | Strong if enforced | Group + CA | Medium–High | Excellent |
| **GitHub** | Dev-familiar | Org sprawl; weaker admin boundary if loose | GitHub org | GitHub recovery | Depends on org 2FA | Org/team membership | Medium | Good |
| **Other enterprise IdPs (Okta, etc.)** | Central IAM | Cost/complexity if not already owned | That IdP | IdP-specific | Usually strong | IAM workflows | High | Good via OIDC/SAML |
| **IP-only “identity”** | Simple | Fails changing networks | Static IPs | N/A | None | Fragile | Low | Misuse — **rejected as primary** |

### 6.2 Recommended primary IdP

**Primary IdP: Cloudflare Email OTP (One-Time PIN) to an explicit administrator email allowlist.**

Rationale:

1. Matches multi-network ops without IP allowlists.  
2. Fits a **small PENDING roster** without assuming Google/Entra already exist for ARGOS operators.  
3. Provides MFA-equivalent challenge on every new Access authentication.  
4. Lowest external dependency for v1 while Zero Trust tenant state remains unverified.  
5. Compatible with Cloudflare Zero Trust Access Allow policies.

**If** operator evidence later shows Google Workspace or Entra already used by all admins with **org-enforced MFA**, CAB may switch primary to Google or Entra **before implementation** — that switch is an operator decision, not an assumption. Until proven, Email OTP remains the design primary.

### 6.3 Emergency fallback IdP

**Emergency fallback: Google identity (personal or Workspace) enrolled as secondary IdP for break-glass identities only**, with Google MFA enforced.

If Google is unavailable to the team at implementation time: **fallback = second Email OTP identity** dedicated to break-glass (distinct mailbox), stored in ops vault procedure — still MFA via OTP; never a Bypass policy.

| Role | IdP |
| --- | --- |
| Day-to-day Coolify admins | Primary: Email OTP |
| Break-glass / emergency owner | Fallback: Google **or** dedicated OTP break-glass mailbox |

### 6.4 Explicitly out of scope for identity

- WARP as auth substitute  
- Gateway as auth substitute  
- Service tokens for human interactive login  

---

## 7. Administrator Model

### 7.1 Principles

- Explicit allowlist only.  
- Least privilege: Coolify Access ≠ Cloudflare Super Admin.  
- No invented identities — roster **PENDING**.  
- Individual emails preferred over shared mailboxes.  
- Offboarding must revoke Access **and** Coolify local user **and** dashboard roles if any.

### 7.2 Role classes

| Role | Access Allow? | CF dashboard? | Coolify native user? | Notes |
| --- | --- | --- | --- | --- |
| Coolify Operator | Yes | No (default) | Yes | Day-to-day |
| Coolify Lead / SRE | Yes | Optional read | Yes | Incidents |
| Emergency owner / Incident Commander | Yes (recommended) | Break-glass capable | Yes or coordinated | CAB for Access disable |
| Cloudflare break-glass admin | Optional | **Yes** | Optional | Recover Access/Tunnel config |
| External consultant | Time-boxed Allow only | No | Time-boxed Coolify user | Mandatory end date |
| Temporary administrator | Time-boxed Allow | No | Time-boxed | Same |
| Portal end users | **No** | No | No | Public apps |
| Automation / CI | Service token **later only** | No | N/A | Not v1 human path |

### 7.3 Roster template (PENDING — do not invent)

| Slot | Role | Name | Email | IdP | MFA evidence | Coolify user | End date | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Lead / SRE | PENDING | PENDING | PENDING | PENDING | PENDING | — | PENDING |
| A2 | Operator | PENDING | PENDING | PENDING | PENDING | PENDING | — | PENDING |
| A3 | Emergency owner | PENDING | PENDING | PENDING | PENDING | PENDING | — | PENDING |
| BG1 | CF break-glass | PENDING | PENDING | PENDING | PENDING | — | — | PENDING |
| BG2 | CF break-glass backup | PENDING | PENDING | PENDING | PENDING | — | — | PENDING |
| T* | Temporary / consultant | PENDING | PENDING | PENDING | PENDING | PENDING | **Required** | PENDING |

**Implementation gate:** Access Allow policy must not be created until A1 + BG1 are filled in ops vault with MFA evidence.

### 7.4 Expansion, removal, offboarding

| Process | Design |
| --- | --- |
| Future expansion | CAB ticket → add email to Allow → create Coolify user → MFA evidence → audit |
| Temporary / consultant | Mandatory expiry; calendar reminder; auto-remove from Allow on end date |
| Removal / offboarding | Same day: remove Access Allow → disable Coolify user → revoke sessions → confirm deny test → update roster |
| Emergency owner | Named before impl; dual-auth culture aligned with DR runbook |

---

## 8. MFA Design

### 8.1 Mandate

**MFA is mandatory for every Access Allow decision. Do not weaken MFA.**

No MFA-exempt admin accounts for Coolify Access.

### 8.2 Primary and fallback MFA

| Path | Primary MFA | Fallback |
| --- | --- | --- |
| Email OTP primary IdP | Email one-time PIN | Protect mailbox with provider MFA; break-glass Google/OTP identity |
| If switched to Google/Entra | IdP MFA (TOTP/security key/push) **enforced org-wide** | Alternate enrolled factor; break-glass identity |

### 8.3 Authentication flow (design)

1. User navigates to `https://coolify.argos-it.com`.  
2. Cloudflare Access challenge (IdP / OTP).  
3. MFA satisfied.  
4. Access session established.  
5. Coolify native login presented.  
6. Coolify session established.  
7. UI / terminal / realtime proceed under both sessions.

Unauthenticated users must see **Access challenge**, not Coolify login.

### 8.4 Recovery scenarios

| Event | Recovery | Evidence |
| --- | --- | --- |
| Lost MFA device (Google/Entra) | IdP account recovery / backup codes per IdP policy | Ticket; no secrets in Git |
| Lost mailbox (OTP) | Mailbox provider recovery; interim break-glass identity via CAB | Ticket; roster update |
| Lost break-glass | Use BG2; rotate BG1 | Dual control |
| Emergency recovery | CAB → temporary Access disable **or** Allow break-glass only — **never** permanent Bypass | CAB record; start/end UTC |

### 8.5 Evidence requirements (before impl acceptance)

| Evidence | Required |
| --- | --- |
| MFA enabled for every Allow identity | Yes |
| Deny test for non-roster identity | Yes |
| No Bypass policies present | Yes |
| Break-glass can open CF Zero Trust console | Yes |

---

## 9. Access Policy Design

### 9.1 Application (conceptual only)

| Field | Design |
| --- | --- |
| Name | `argos-coolify-admin` |
| Type | Self-hosted / hostname Access app |
| Domain | `coolify.argos-it.com` |
| IdPs enabled | Primary Email OTP + emergency fallback IdP |
| Portal/API apps | **Do not create** |

### 9.2 Evaluation posture

| Element | Design |
| --- | --- |
| Default | **Deny** (no match → denied) |
| Evaluation order | Platform policy order: specific Allow first; default deny; optional explicit Deny for clarity |
| Priority | Tightest admin Allow; no competing Bypass |
| Include | Roster emails (or equivalent tightly controlled IdP group mapped 1:1 to roster) |
| Exclude | None required for v1 |
| Require | **MFA** (OTP or IdP MFA) |
| Country restrictions | **Not recommended** as primary control (travel / changing networks). Optional deny-list of high-risk geos only if CAB accepts false-positive risk — default **off** |
| Device requirements | **Future optional** (device posture) — not blocking for v1 |
| Bypass policy | **No permanent Bypass.** Emergency = disable app or temporary named Allow with expiry — not path Bypass |
| Service Auth | **Not** for human v1. Future CI tokens only under separate CAB |

### 9.3 Allow policy (design)

| Field | Value |
| --- | --- |
| Name | `allow-coolify-operators` |
| Action | Allow |
| Include | PENDING roster emails |
| Require | MFA |
| Session controls | See §10 |

### 9.4 Default deny

| Field | Value |
| --- | --- |
| Name | Platform default deny and/or explicit `deny-all-others` |
| Action | Deny |
| Include | Everyone not matched by Allow |

### 9.5 Forbidden

| Policy | Status |
| --- | --- |
| Bypass `/` | Forbidden |
| Bypass `/terminal` or WS paths | Forbidden |
| Allow Everyone | Forbidden |
| IP-only Allow as sole control | Forbidden |
| Permanent Bypass left after incident | Forbidden |
| Service Auth for humans | Forbidden |

**Statement: No permanent Bypass.**

---

## 10. Session Design

### 10.1 Two sessions

| Session | Owner | Purpose |
| --- | --- | --- |
| Access (browser) | Cloudflare Access | Edge identity |
| Coolify | Coolify application | App authorization |

Both required for normal admin work.

### 10.2 Access session parameters

| Parameter | Design target |
| --- | --- |
| Maximum session duration | **12 hours** (CAB may pick 8–24h before impl; document choice) |
| Idle timeout | Enable if plan supports; prefer **≤ 12 hours** idle or less |
| Cookie lifetime | Bound to Access session settings; Secure / HttpOnly as CF default |
| Reauthentication | On Access expiry → new IdP/OTP challenge |
| Logout | Access logout / cookie clear ends edge session; Coolify logout is separate |

### 10.3 WebSocket and terminal persistence

| Behavior | Design expectation |
| --- | --- |
| During valid Access + Coolify sessions | WS/terminal remain up |
| After Access expiry | Subsequent HTTP/WS fail Access; terminal should drop or fail reconnect until re-auth |
| After Coolify expiry | Coolify login again (Access may still be valid) |
| Reconnect | Browser must present valid Access session; no unauthenticated WS |

### 10.4 Expected behavior after Access expiry

1. UI calls receive Access challenge / hard fail.  
2. Open terminal/WS disconnects or cannot rehandshake.  
3. Operator re-authenticates Access → Coolify session may still exist or may need refresh — **PENDING VERIFICATION** at soak.

---

## 11. WebSocket and Terminal

### 11.1 Surfaces

| Surface | Behind Access hostname? | Notes |
| --- | --- | --- |
| Coolify UI | Yes | Protected |
| Deploy logs / live views | Yes if same host | **PENDING VERIFICATION** paths |
| Realtime | Yes if same host; raw `:6001`/`:6002` are not | Residual until 10C.7 |
| Terminal UI | Yes | No Bypass |
| Terminal WebSocket | Yes | No Bypass |
| Live events | Yes if same host | **PENDING VERIFICATION** |

### 11.2 Authentication continuity

- WS upgrades occur only after Access auth (cookie/JWT as CF provides).  
- Coolify must still authorize terminal actions via native session.  
- Revoking Access mid-session must terminate effective admin WS use.

### 11.3 Reconnect behavior (design expectation)

| Event | Expected |
| --- | --- |
| Brief network blip | Reconnect if sessions still valid |
| Access expired | Re-auth Access before WS works |
| Coolify restarted | Native re-login; Access may persist |

### 11.4 Known unknowns (retain)

- Exact Coolify paths (`/terminal`, `/terminal/ws`, realtime routes)  
- Whether realtime requires separate origin to `:6001`/`:6002`  
- Cookie/`SameSite` interaction Access ↔ Coolify on installed version  
- WS behavior after Access revoke timing  

**No implementation in this phase.**

---

## 12. Break-Glass

### 12.1 Scenario matrix

| Scenario | Primary action | Secondary | CAB? |
| --- | --- | --- | --- |
| Cloudflare outage | Wait / status; direct `:8000` only if still open + CAB | SSH later (10C.9) | Yes for direct port use post-policy |
| Access outage / misconfig | BG1/BG2 fix or temporarily disable Access app | Direct port while open | **Yes** to disable |
| IdP / OTP email outage | Switch to fallback IdP / BG identity | Disable Access (CAB) | Yes |
| Lost MFA / lost email | IdP/mailbox recovery; BG identity | CAB Access disable | Yes if locked out |
| Tunnel unavailable | Restore `cloudflared` via SSH (ops) | Direct port while open | Per Tunnel runbook |
| Coolify unavailable | Coolify/DR procedures — Access cannot fix origin down | DR runbook | Per DR |
| Provider console | BG1/BG2 MFA dashboard access | — | Pre-verified |
| Temporary Access disable | Disable app or policy enforcement | Re-enable before window ends | **Mandatory** |

### 12.2 Controls

| Control | Design |
| --- | --- |
| Owner | **PENDING** (Emergency owner A3 + BG1) |
| Approval chain | Dual authorization aligned with DR (Incident Commander + second approver) |
| Maximum emergency window | **4 hours** default; extend only with new CAB note |
| Audit evidence | Who / why / start UTC / end UTC / ticket / actions (no secrets) |
| Rollback | Re-enable Access; remove any temporary Allow; confirm challenge + deny tests |
| Abuse prevention | No standing Bypass; every disable has end time; post-incident review |

---

## 13. Validation Matrix

Future validation only — not executed now.

| Test | Method | Expected | Evidence |
| --- | --- | --- | --- |
| Anonymous access | GET Coolify host, no cookies | Access challenge only | Capture |
| Authenticated access | Roster identity + MFA | Access success | Note (no secrets) |
| Denied identity | Non-roster account | Denied | Note |
| MFA challenge | New session | MFA/OTP required | Note |
| Session renewal | Near expiry / re-login | Re-challenge per design | Note |
| Logout | Access + Coolify logout | Sessions cleared as designed | Note |
| Coolify login | After Access | Native login works | Note |
| Deploy screen | UI | Loads | Note |
| Terminal | Interactive | Works | Note |
| Realtime | Live logs/events | Works | Note |
| Portal | GET `/` | 200 unchanged | Capture |
| API | `/api/health` | OK unchanged | Capture |
| Monitoring | argos-prod-ops | Green for portal/API | Log |
| Tunnel state | CF + systemd | Connected | Status |
| Raw ports (transition) | External probe | Still open until 10C.7 | Probe log |

Rollback triggers: Coolify login visible without Access; Allow Everyone; portal/API behind Access; terminal fixed only via Bypass; admin lockout without BG recovery.

---

## 14. Rollback Matrix

| Scenario | Rollback | Owner | Recovery time | Evidence / acceptance |
| --- | --- | --- | --- | --- |
| Access application bad | Disable/delete app for `coolify` only (CAB) | PENDING | 15–30 min | Challenge gone; Coolify reachable per interim; portal/API OK |
| Policies bad | Revert to last known Allow/deny; or disable app | PENDING | 15–30 min | Roster can auth; deny test passes |
| IdP bad | Disable IdP binding; use fallback; or disable Access | PENDING | 15–60 min | Auth path restored |
| Tunnel dependency fail | Fix Tunnel per 10C.5; Access cannot substitute transport | PENDING | Per Tunnel | Connector healthy |
| Hostname wrong | Remove Access from wrong host immediately | PENDING | 5–15 min | Portal/API proof |
| Session issues | Clear cookies; shorten/fix session settings; disable Access if locked | PENDING | 15–30 min | Clean login path |
| MFA failure / lockout | BG console recovery; mailbox/IdP recovery; CAB disable | PENDING | 15–60 min | At least BG path works |
| Break-glass invoked | Re-enable Access within max window; remove temp Allows | PENDING | ≤ 4 h window | Challenge + deny tests; CAB closeout |

**Forbidden rollback:** leaving permanent Bypass enabled.

---

## 15. Risk Matrix

| ID | Risk | Security benefit if correct | Business impact | Operational impact | Recovery complexity | Likelihood | Severity | Mitigation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Wrong identity in Allow | — | High | High | Low | Medium | Critical | PENDING roster peer review; deny test |
| R2 | Missing MFA | — | Critical | Medium | Low | Medium | Critical | Mandatory MFA; evidence gate |
| R3 | Email compromise (OTP) | — | High | Medium | Medium | Medium | High | Mailbox MFA; short sessions; BG revoke |
| R4 | Session hijacking | Reduced with short TTL + MFA | High | Medium | Medium | Low–Med | High | 12h max; logout discipline; HTTPS only |
| R5 | Tunnel unavailable | — | Medium | High | Medium | Medium | High | 10C.5 recovery; ports open in transition |
| R6 | Cloudflare outage | — | Medium | High | Medium | Low | High | Break-glass; later SSH (10C.9) |
| R7 | Policy mistake (Everyone/Bypass) | — | Critical | High | Low | Medium | Critical | Forbidden list; peer review |
| R8 | Operator lockout | — | High | Critical | Medium | Medium | Critical | BG1/BG2; CAB disable; dual auth |
| R9 | WebSocket failure | — | Medium | High | Medium | Medium | High | No Bypass fix; rollback Access; verify paths |
| R10 | Break-glass abuse | — | Critical | High | High | Low | Critical | Time-boxed disable; audit; post-review |
| R11 | False safety (ports open) | Incomplete without 10C.7 | High | Medium | — | Certain until 10C.7 | High | Explicit residual exposure; gate lockdown |
| R12 | Portal/API behind Access | — | Critical | Critical | Low | Low | Critical | Boundary §5; emergency remove |

---

## 16. Dependencies

| Dependency | Relationship | Do not redesign |
| --- | --- | --- |
| **10C.5 Tunnel** | Preferred transport; Access enforces identity on Tunnel hostname | Tunnel architecture already defined |
| **10C.7 Origin Lockdown** | Removes raw-port bypass after Access+WS PASS | Sequence only |
| **10C.8 Firewall** | Host firewall hardening after lockdown baseline | — |
| **10C.9 SSH** | Break-glass when ports closed | — |
| **DR Runbook** | Dual auth culture; Coolify/Traefik/portal recovery | Do not rewrite DR here |
| **Monitoring** | argos-prod-ops remains portal/API/PG; optional Access checks later — **no changes now** | — |
| **Backups / R2** | Independent of Access | — |
| **DNS / Zone (10C.3–4)** | Zone/Tunnel sequencing preferred before Access enforcement | — |

```
10C.4 DNS/zone → 10C.5 Tunnel → 10C.6 Access → validate → 10C.7 lockdown → 10C.8 firewall → 10C.9 SSH
```

---

## 17. Known Unknowns

| ID | Unknown | Must remain visible |
| --- | --- | --- |
| U1 | Final administrator roster | Yes — PENDING |
| U2 | Final IdP confirmation vs tenant reality | Yes — design primary OTP until proven otherwise |
| U3 | Cloudflare Zero Trust tenant state | Yes |
| U4 | Tunnel deployment status | Yes — currently NOT deployed |
| U5 | Access application UUID | Yes — none until impl |
| U6 | WebSocket behavior after implementation | Yes |
| U7 | MFA enforcement evidence per admin | Yes |
| U8 | CAB approval for impl | Yes |
| U9 | Provider console readiness (BG1/BG2) | Yes |
| U10 | Exact Coolify terminal/realtime paths | Yes |
| U11 | Final session duration pick (8/12/24h) | Yes — design default 12h |
| U12 | Email OTP deliverability to PENDING mailboxes | Yes |
| U13 | Whether Google fallback accounts exist | Yes |

Nothing above may disappear silently.

---

## 18. Future Phases

```
10C.6  Access Policy Design (this document)     DESIGN ONLY
  ↓
10C.6-IMPL (future authorization)  IdP + Access app + policies
  ↓
Validation soak (matrix §13)
  ↓
10C.7  Origin Lockdown
  ↓
10C.8  Firewall Hardening
  ↓
10C.9  SSH Hardening
```

| Phase | Access-related expectation |
| --- | --- |
| Now | Design only |
| 10C.6-IMPL | Enforce Access; raw ports still open |
| 10C.7 | Close residual bypass ports |
| 10C.8–9 | Reduce dependence on open-port emergency paths |

---

## 19. Final Status

### Decision summary

| Topic | Decision |
| --- | --- |
| Boundary | Only `coolify.argos-it.com`; portal/API public |
| Primary IdP | **Email OTP (Cloudflare One-Time PIN)** |
| Emergency fallback | **Google** (or dedicated OTP break-glass if Google unavailable) |
| MFA | Mandatory — do not weaken |
| Policies | Allow roster + default deny; **no permanent Bypass** |
| Sessions | Access max **12h** design target + Coolify native session |
| Tunnel | Access in front of Tunnel hostname |
| Lockdown | After Access validation → 10C.7 |

### Final Decision

**READY FOR DOCUMENT REVIEW**

Rationale: Access boundary, identity (primary + fallback), administrator model, MFA, policies, sessions, WS/terminal, break-glass, validation, rollback, risks, dependencies, and known unknowns are complete and aligned with 10C.5. Roster/IdP tenant evidence correctly remain PENDING and block implementation — not this design review.

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

Tunnel Modified:

NO

Access Modified:

NO

Commits:

NO

Push:

NO

Next Authorized Action:

DOCUMENT REVIEW ONLY

STOP.
