# Cloudflare Zone Staging Design — argos-it.com

## Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Document** | `docs/CLOUDFLARE_ZONE_STAGING_DESIGN.md` |
| **Phase** | **10C.4** |
| **Revision** | 1 |
| **Type** | DESIGN ONLY — NO IMPLEMENTATION |
| **Source of truth** | `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` Revision 2 (PHASE 10C.3A.3) |
| **Design readiness** | See Final Decision |
| **Zone creation authorized** | **NO** |
| **NS cutover authorized** | **NO** |

### Authority and non-authorization notice

This document is **design and documentation only**.

It does **not** authorize:

- creation of a Cloudflare DNS zone;
- import or mutation of DNS records;
- Hostinger panel or DNS changes;
- nameserver changes at registrar;
- DNSSEC / DS changes;
- `cloudflared` install;
- Tunnel, Access, WAF, firewall, SSH, Docker, Traefik, Coolify changes;
- certificate changes;
- commits or pushes as operational cutover work.

No infrastructure, DNS, Cloudflare, or Hostinger was modified by producing this document.

---

## Executive Summary

PHASE 10C.4 defines how a **non-authoritative Cloudflare DNS zone staging copy** for `argos-it.com` must be built, validated, and prepared for a future nameserver cutover — without enabling proxy, Tunnel, Access, or origin lockdown in this phase.

**Current reality (unchanged):**

- Authority remains Hostinger parking NS: `ns1.dns-parking.com`, `ns2.dns-parking.com`
- Cloudflare account exists; R2 is already used for production backups
- No Cloudflare DNS zone for `argos-it.com`
- No Tunnel, no Access, no `cloudflared`
- Production / VPS / Traefik / Coolify untouched

**Zone staging design principles:**

1. Full-zone mirror (not partial CNAME / Cloudflare-for-SaaS unless plan level is later proven).
2. **All records DNS-only (grey cloud)** for staging and initial cutover.
3. Source of record values: Hostinger **panel export** (mandatory) + live auth dig cross-check.
4. Apex A/AAAA are **DYNAMIC** — never pin obsolete dig IPs.
5. Tunnel / Access / firewall / SSH must not be dependencies of DNS cutover.
6. R2 continues independently of whether the domain zone is authoritative in Cloudflare.

**Blocking for implementation (not for this design document):** Hostinger panel export still missing → zone populate + peer diff cannot complete. Design can be reviewed now; zone creation remains a future authorized implementation step.

---

## Architecture

### 1. Cloudflare Zone Architecture (target end-state after future cutover)

```
┌─────────────────────────────────────────────────────────────────┐
│ REGISTRAR / HOSTINGER (domain ownership)                        │
│  Domain: argos-it.com                                           │
│  TODAY: NS → ns1.dns-parking.com, ns2.dns-parking.com           │
│  FUTURE (authorized later): NS → Cloudflare-assigned NS         │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────────┐
│ HOSTINGER DNS       │  TODAY auth   │ CLOUDFLARE DNS ZONE     │
│ (parking NS)        │◄─────────────►│ argos-it.com            │
│ WordPress apex/www  │  FUTURE:      │ STAGING: non-auth copy  │
│ Mail (MX/DKIM/…)    │  CF becomes   │ CUTOVER: authoritative  │
│ Dynamic apex A/AAAA │  authority    │ All records DNS-only    │
└─────────────────────┘               └───────────┬─────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
         ┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
         │ Hostinger web    │          │ VPS origin       │          │ Hostinger mail   │
         │ CDN / WP         │          │ 91.108.121.181   │          │ mx1/mx2, DKIM    │
         │ apex + www       │          │                  │          │                  │
         └──────────────────┘          │ Traefik (Coolify │          └──────────────────┘
                                       │  proxy)          │
                                       │  ├─ portal       │
                                       │  ├─ api.portal   │
                                       │  ├─ staging      │
                                       │  └─ coolify      │
                                       │ Coolify native   │
                                       │  auth (kept)     │
                                       └──────────────────┘

Cloudflare R2 (already active) ── independent of zone NS authority
Future Tunnel (10C.5) / Access (10C.6) ── NOT part of zone staging
```

### Authoritative flow (today vs staging vs post-cutover)

| Stage | Who answers public DNS | Cloudflare zone role | Hostinger parking NS |
| --- | --- | --- | --- |
| **Today** | Hostinger parking NS | Does not exist | Authoritative |
| **Zone staging (this design)** | Hostinger parking NS | Non-authoritative mirror (peer-diff only) | Still authoritative |
| **Post NS cutover (future auth)** | Cloudflare NS | Authoritative DNS-only zone | No longer authoritative for public queries |
| **Post 10C.5+** | Cloudflare NS | DNS + optional proxy/Tunnel/Access later | Unchanged for mail targets |

### Component roles

| Component | Role in 10C.4 design |
| --- | --- |
| Registrar / Hostinger | Owns domain; holds NS switch; DNSSEC/DS verification |
| Hostinger DNS | Source of truth until cutover; marketing site + mail |
| Cloudflare DNS zone | Staging mirror → future authority; grey-cloud only |
| Origin VPS `91.108.121.181` | Portal, API, staging, Coolify A targets |
| Traefik | Terminates HTTPS for app hostnames on VPS |
| Coolify | Orchestrates Traefik/apps; native auth remains |
| Cloudflare R2 | Backups already; independent of this zone |
| Tunnel / Access | Explicitly deferred (10C.5 / 10C.6) |

---

## Zone Design

### Staging zone definition

| Item | Design value |
| --- | --- |
| Zone name | `argos-it.com` |
| Zone type | Full DNS zone (standard) |
| Plan assumption | Do **not** assume Cloudflare-for-SaaS / partial CNAME |
| Initial proxy | **Disabled for all records** (DNS-only) |
| SSL mode | Leave Cloudflare SSL unused for grey-cloud origins until proxy/Tunnel design; Traefik/LE remains origin TLS path |
| DNSSEC in CF | Off until post-cutover optional enable (after DS handling) |
| Population source | Hostinger panel export + auth dig `@ns1/ns2.dns-parking.com` |
| Peer-diff gate | Mandatory before any NS change |
| Apex A/AAAA method | Copy **live panel definition** at populate/cutover time; re-dig immediately before peer diff; never use Rev 1 obsolete IPs |

### Staging procedure (design only — not authorized to execute)

1. Obtain Hostinger DNS panel export (blocking gate).
2. Confirm DNSSEC/DS status at Hostinger + registrar.
3. When authorized: create Cloudflare zone `argos-it.com` (implementation phase, not this doc).
4. Record Cloudflare-assigned nameservers for future registrar update.
5. Import/create every record from § DNS Tables as **DNS-only**.
6. For apex A/AAAA: use panel values / Hostinger-prescribed ALIAS pattern — not historical dig snapshots.
7. Peer-diff: Hostinger export vs Cloudflare zone vs live auth dig.
8. Keep Hostinger NS authoritative until all cutover gates pass.
9. Do not enable orange cloud, Tunnel, Access, WAF, or origin lockdown as part of staging.

### Implementation items deferred (STOP — do not execute here)

| ID | Future implementation item |
| --- | --- |
| IMP-01 | Obtain Hostinger DNS panel export |
| IMP-02 | Create Cloudflare zone `argos-it.com` |
| IMP-03 | Populate DNS records (DNS-only) |
| IMP-04 | Peer-diff Hostinger ↔ Cloudflare |
| IMP-05 | Confirm registrar credentials + DNSSEC/DS |
| IMP-06 | Nameserver cutover (separate authorization) |
| IMP-07 | Post-cutover validation window + mail test |
| IMP-08 | 10C.5 Tunnel / 10C.6 Access / 10C.7–9 hardening |

---

## DNS Tables

### Legend

| Column | Meaning |
| --- | --- |
| Value source | Where the Cloudflare value must come from |
| Proxy state | Staging + initial cutover target |
| DNS only | Required grey-cloud |
| Proxied | Must remain **NO** for this phase; MAY later only if noted |
| Migration priority | P0 critical path / P1 required / P2 verify / P3 unknown |
| Rollback impact | Effect if wrong or missing after cutover |
| Class | See Record Classification |

### Complete record design table

| Hostname | Type | Value source | TTL (design) | Proxy state | DNS only | Proxied | Reason | Migration priority | Rollback impact | Dependencies | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `@` | NS | Cloudflare-assigned after zone create (not copied from Hostinger) | Auto | N/A | N/A | N/A | Zone authority markers | P0 (post-create) | Wrong NS = broken resolution | Registrar update only at cutover | Infrastructure |
| `@` | A | **Hostinger panel live** (DYNAMIC; re-dig at peer-diff) | Match panel / 60 | DNS-only | YES | NO | Marketing site apex; IPs rotate | P0 | Site down / wrong Hostinger edge | Hostinger web/CDN | Application |
| `@` | AAAA | **Hostinger panel live** (DYNAMIC) | Match panel / 60 | DNS-only | YES | NO | Apex IPv6 pair | P0 | IPv6 clients fail or hit stale edge | Hostinger web/CDN | Application |
| `www` | CNAME | `www.argos-it.com.cdn.hstgr.net.` (AUTH DIG + panel) | 300 | DNS-only | YES | NO | Hostinger CDN hostname | P0 | www site broken | Hostinger CDN | Application |
| `portal` | A | `91.108.121.181` (AUTH DIG + confirm) | 14400 → optional lower later | DNS-only | YES | NO (MAY later) | Public portal → Traefik | P0 | Portal unavailable | Traefik / VPS | Application |
| `api.portal` | A | `91.108.121.181` | 14400 → optional lower later | DNS-only | YES | NO (MAY later) | Public API → Traefik | P0 | API / health fail | Traefik / VPS | Application |
| `coolify` | A | `91.108.121.181` | 14400 → optional lower later | DNS-only | YES | NO (MAY later via Tunnel path) | Coolify hostname | P0 | Admin UI hostname broken | Coolify / VPS | Infrastructure |
| `staging` | A | `91.108.121.181` | 14400 → optional lower later | DNS-only | YES | NO (MAY later) | Staging host | P1 | Staging env unreachable | Traefik / VPS; owner TBD | Application |
| `@` | MX | `5 mx1.hostinger.com.` | 14400 | DNS-only | YES | **NEVER** | Inbound mail | P0 | Mail delivery failure | Hostinger mail | Mail |
| `@` | MX | `10 mx2.hostinger.com.` | 14400 | DNS-only | YES | **NEVER** | Inbound mail secondary | P0 | Reduced mail resilience | Hostinger mail | Mail |
| `@` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | 3600 | DNS-only | YES | **NEVER** | SPF | P0 | Spoofing / deliverability | Hostinger SPF include | Mail |
| `@` | TXT | `MS=ms77525352` | 3600 | DNS-only | YES | **NEVER** | Microsoft domain verify | P1 | MS services re-verify fail | Microsoft | Verification |
| `@` | TXT | `0x1608771ccaa6b895d53c24f023f6374c2f471878` | 3600 | DNS-only | YES | **NEVER** | Purpose UNKNOWN — preserve | P1 | Unknown service break | Unknown | Unknown |
| `_dmarc` | TXT | `v=DMARC1; p=none` | 3600 | DNS-only | YES | **NEVER** | DMARC | P0 | Policy / reporting loss | Mail stack | Mail |
| `autodiscover` | CNAME | `autodiscover.mail.hostinger.com.` | 300 | DNS-only | YES | **NEVER** | Outlook / Exchange discovery | P1 | Client autoconfig fail | Hostinger mail | Mail |
| `autoconfig` | CNAME | `autoconfig.mail.hostinger.com.` | 300 | DNS-only | YES | **NEVER** | Mozilla / other mail autoconfig | P1 | Client autoconfig fail | Hostinger mail | Mail |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com.` | 300 | DNS-only | YES | **NEVER** | DKIM selector A | P0 | DKIM fail → spam | Hostinger DKIM | Mail |
| `hostingermail-b._domainkey` | CNAME | `hostingermail-b.dkim.mail.hostinger.com.` | 300 | DNS-only | YES | **NEVER** | DKIM selector B | P0 | DKIM fail → spam | Hostinger DKIM | Mail |
| `hostingermail-c._domainkey` | CNAME | `hostingermail-c.dkim.mail.hostinger.com.` | 300 | DNS-only | YES | **NEVER** | DKIM selector C | P0 | DKIM fail → spam | Hostinger DKIM | Mail |
| `@` | CAA | `0 issue "letsencrypt.org"` (+ panel extras if any) | 14400 | DNS-only | YES | **NEVER** | Cert issuance control | P0 | LE issuance blocked or wrong CA | Traefik / LE | Security |

### Panel-required placeholders (not yet in AUTH DIG)

If Hostinger panel export shows any of the following, add as DNS-only with exact panel values before cutover:

| Hostname (examples) | Type | Class | Notes |
| --- | --- | --- | --- |
| `mail`, `smtp`, `imap`, `pop`, `pop3`, `webmail` | A/CNAME | Mail / Legacy | Probed empty at auth NS; panel may still define |
| `ftp`, `cpanel` | A/CNAME | Legacy | Panel check |
| Extra TXT (Google/Apple verify) | TXT | Verification | Not visible in public dig |
| Extra CAA (`issuewild`, `iodef`) | CAA | Security | Panel confirm |
| SRV mail records | SRV | Mail | Panel confirm |
| Wildcard `*` | A/CNAME | Legacy / Unknown | Only if panel shows |

### Record Classification

| Class | Records |
| --- | --- |
| **Infrastructure** | Zone NS (Cloudflare-assigned); `coolify` A |
| **Application** | `@` A/AAAA (Hostinger site); `www`; `portal`; `api.portal`; `staging` |
| **Mail** | MX; SPF TXT; DMARC; DKIM CNAMEs; `autodiscover`; `autoconfig` |
| **Verification** | `MS=ms77525352`; any future Google/Apple TXT from panel |
| **Security** | CAA; future DNSSEC (post-cutover optional) |
| **Legacy** | Possible Hostinger-only hostnames from panel (`ftp`, `cpanel`, unused product hosts) |
| **Unknown** | Apex TXT `0x1608771ccaa6b895d53c24f023f6374c2f471878` |

### Proxy Strategy

#### ALWAYS DNS-only (never orange-cloud)

| Record family | Examples | Reason |
| --- | --- | --- |
| Mail exchange | MX | Proxy breaks SMTP targeting |
| Mail auth | SPF, DKIM CNAMEs, DMARC | Must resolve to exact text/CNAME |
| Mail clients | `autodiscover`, `autoconfig` | Must hit Hostinger mail endpoints |
| Mail hosts (if panel adds) | `mail`, `smtp`, `imap`, `pop` | Non-HTTP / Hostinger paths |
| Cert control | CAA | Issuance policy must be literal |
| Verification TXT | MS=…, unknown hex TXT | Exact match required |
| Apex / www while on Hostinger | `@` A/AAAA, `www` CNAME | Hostinger CDN/web; proxy would change path |

#### MAY become proxied later (DO NOT enable in 10C.4)

| Hostname | Condition for later proxy consideration | Blocked until |
| --- | --- | --- |
| `portal` | Explicit proxy/Tunnel design approved; public must stay reachable | Post-DNS stability; possibly 10C.5+ |
| `api.portal` | Same; API health / CORS / WebSockets validated | Same |
| `staging` | Owner-approved; env isolation understood | Owner decision + DNS stable |
| `coolify` | Prefer Tunnel (10C.5) + Access (10C.6) over classic orange-cloud to origin IP | 10C.5 / 10C.6 |

**10C.4 rule:** Proxy state for every record in the staging zone = **DNS-only / Proxied = NO**.

---

## Cloudflare Features Matrix

| Feature | Current state | Future phase | Blocked by | Dependencies |
| --- | --- | --- | --- | --- |
| **DNS** | No zone for domain | 10C.4 impl → cutover | Hostinger export; zone create auth | Registrar NS later |
| **Proxy (orange cloud)** | Not applicable | Optional post-cutover (not default) | Design approval; app validation | DNS authority; possibly Tunnel |
| **Tunnel** | Not installed | **10C.5** | DNS authority stable recommended | `cloudflared`; Coolify hostname design |
| **Access** | None | **10C.6** | Tunnel design; identity provider | Tunnel; Coolify native auth kept |
| **WAF** | Unused for this domain | Post 10C.5+ if proxied | Proxy or Tunnel HTTP path | Proxied hostname or Tunnel public hostname |
| **Caching** | Unused | Only if proxied HTTP | Proxy enabled | Cache rules; origin behavior |
| **Transform Rules** | Unused | Optional later | Proxied path | Proxy / Tunnel |
| **Firewall Rules (CF)** | Unused | With proxy/Tunnel later | Proxied edge | WAF plan; Access policies |
| **Rate Limiting** | Unused | Optional later | Proxied path | Plan limits |
| **Origin Rules** | Unused | Optional later | Proxied path | Proxy |
| **Page Rules** | Unused / legacy | Prefer modern Rules later | N/A | Prefer Transform/Cache Rules |
| **SSL Mode** | N/A (no zone / no proxy) | Only when orange-cloud | Proxy decision | Origin certs (Traefik/LE) |
| **Origin CA** | Not used | Optional with proxy | Proxy design | CF Origin CA install on origin |
| **DNSSEC** | Dig empty; panel/registrar unconfirmed | After cutover optional | DS/DNSSEC confirmation; NS cutover | Registrar DS removal if present **before** cutover |
| **Load Balancer** | Unused | Not planned | N/A | Explicit product decision |
| **R2** | **Active** (backups) | Continues | None for zone | Independent of domain NS |
| **Workers** | Unused for this domain | Not planned for cutover | N/A | Explicit product decision |
| **Queues** | Unused | Not planned | N/A | — |
| **Turnstile** | Unused | App-level later if needed | App change | Portal/API code |

---

## Dependency Graph

```
Hostinger (panel export + parking NS authority)
    ↓
Cloudflare DNS zone staging (DNS-only mirror)     ← 10C.4 design / future impl
    ↓
Peer diff + cutover gates
    ↓
Nameserver cutover (registrar)                    ← separate authorization
    ↓
Stable public DNS on Cloudflare
    ↓
Tunnel (cloudflared)                              ← 10C.5
    ↓
Cloudflare Access (Coolify)                       ← 10C.6
    ↓
Origin / admin-port lockdown                      ← 10C.7
    ↓
Firewall hardening                                ← 10C.8
    ↓
SSH hardening                                     ← 10C.9
```

### Hard constraints

- DNS cutover **must not** require Tunnel or Access.
- Origin lockdown **must not** precede stable DNS + Tunnel/Access for Coolify admin paths.
- R2 does not depend on this graph for backup operation.
- Portal and API remain public through DNS migration.

---

## Validation Matrix

| Stage | Pre-checks | Validation | Expected results | Evidence | Rollback trigger |
| --- | --- | --- | --- | --- | --- |
| **A. Design review (now)** | Rev 2 inventory read; this doc complete | Document review sign-off | Design accepted or revision list | Reviewed doc | Design gaps → DESIGN REQUIRES REVISION |
| **B. Hostinger export (impl)** | Panel access | Export completeness vs AUTH DIG | All dig records present + any extras listed | Export file + checklist | Incomplete export → stop |
| **C. Zone create + populate (impl)** | Export + DNSSEC status known | CF zone records = export; all grey-cloud | Peer diff zero unexplained deltas | CF UI/API export + dig `@CF-NS` (private preview) | Wrong records → fix CF; **do not** change registrar NS |
| **D. Pre-cutover** | Gates 1–13 from Rev 2 + this doc | Apex method documented; mail set exact; validation plan approved | All gates PASS | Gate checklist signed | Any FAIL → no NS change |
| **E. NS cutover** | Registrar ready; rollback owner named | `dig NS` → CF NS; full matrix | Portal/API/staging/coolify/mail/www OK | dig + HTTPS + mail window | Site/mail/API fail → revert NS to Hostinger parking |
| **F. Stabilize** | 24–72h watch | No silent mail/web regression | Stable | Logs + dig samples | Late failure → NS rollback |
| **G. 10C.5+** | DNS stable | Separate phase docs | Tunnel/Access only after DNS OK | Phase reports | Phase-specific rollback |

### Per-hostname expected results (post-cutover)

| Check | Expected |
| --- | --- |
| NS | Cloudflare-assigned NS |
| Apex A/AAAA | Match Hostinger intent (panel / live pattern) |
| `www` | CNAME → `www.argos-it.com.cdn.hstgr.net.` |
| `portal` / `api.portal` / `staging` / `coolify` | A → `91.108.121.181` |
| MX / SPF / DMARC / DKIM / autoconfig / autodiscover | Exact Hostinger values |
| CAA | Panel-complete set; LE still works |
| Coolify login | Native auth still works |

---

## Rollback Matrix

| Future step | Rollback | Recovery | Max rollback time (design target) | Risk if delayed | Owner |
| --- | --- | --- | --- | --- | --- |
| Zone populate error (pre-NS) | Edit/delete CF records; keep Hostinger NS | Re-import from export | Minutes–1h | Low (public DNS unchanged) | **PENDIENTE** |
| Peer-diff fail | Do not cut over; fix CF copy | Re-diff | Hours | Low | **PENDIENTE** |
| NS cutover failure | Revert NS to `ns1.dns-parking.com`, `ns2.dns-parking.com` | Wait TTL/propagation; re-validate | 15–60 min to initiate; propagation up to prior TTL | High (web/mail) | **PENDIENTE** |
| DNSSEC/DS mishandle | Restore DS/NS per registrar procedure | Support ticket if registry lag | Hours–days | High | **PENDIENTE** |
| Mail failure post-cutover | NS rollback first | Then fix CF mail records | Immediate initiate | Critical (business mail) | **PENDIENTE** |
| Portal/API failure | NS rollback (prefer) before host surgery | Confirm Traefik still healthy on IP | Immediate initiate | Critical (product) | **PENDIENTE** |
| Tunnel (10C.5) | Disable tunnel route; keep DNS A | Restore direct A to VPS | Minutes | Medium | Future phase |
| Access (10C.6) | Disable Access app; native auth remains | Confirm Coolify login | Minutes | Medium | Future phase |
| Origin lockdown (10C.7+) | Re-open required ports carefully | Documented firewall restore | Minutes–hours | High if SSH locked wrong | Future phase |

**Rule:** Prefer **NS rollback** over emergency Docker/firewall/SSH changes for DNS-phase incidents.

Rollback owners are **not named** → remains a Known Unknown / cutover gate.

---

## Risk Matrix

| ID | Category | Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- | --- | --- |
| R1 | Operational | Incomplete Hostinger inventory | High (current) | High | Block cutover until panel export + peer diff |
| R2 | Availability | Stale DYNAMIC apex IPs copied to CF | High if ignored | High | Panel-live values only; re-dig at peer-diff |
| R3 | Business | Mail MX/DKIM/SPF mismatch | Medium | Critical | Exact copy; never proxy mail; mail test window |
| R4 | Security | DNSSEC DS left pointing at Hostinger after NS change | Medium if DS exists | Critical | Confirm DS; remove before cutover if present |
| R5 | Availability | Accidental orange-cloud on portal/API | Medium (human error) | High | Staging checklist: all grey; peer review |
| R6 | Security | Enabling Access/Tunnel before DNS stable | Medium | Medium | Phase order 10C.4→5→6 |
| R7 | Operational | Unknown TXT `0x16…` dropped | Medium | Unknown | Preserve until purpose proven |
| R8 | Business | `staging` purpose unclear | Medium | Low–Medium | Owner confirmation before special handling |
| R9 | Recovery | No named rollback owner | High (current) | High | Name owner before NS change |
| R10 | Availability | TTL 14400 delays rollback visibility | Medium | Medium | Optional authorized TTL lower pre-cutover |
| R11 | Security | Origin ports still public after DNS move | Certain until 10C.7+ | High | Defer lockdown; do not pretend DNS fixes ports |
| R12 | Operational | Assuming partial CNAME / SaaS | Low–Medium | High | Full zone only unless plan proven |

---

## Future Roadmap

```
10C.4  Cloudflare Zone Staging Design          ← this document (DESIGN ONLY)
   ↓
10C.4-IMPL (future auth)  Zone create + populate + peer diff   [NOT AUTHORIZED]
   ↓
NS CUTOVER (future auth)  Registrar NS → Cloudflare            [NOT AUTHORIZED]
   ↓
10C.5  Tunnel Design / Implementation
   ↓
10C.6  Cloudflare Access (Coolify; native auth remains)
   ↓
10C.7  Origin Lockdown (admin ports / Traefik publish surface)
   ↓
10C.8  Firewall Hardening
   ↓
10C.9  SSH Hardening
```

| Phase | Scope | Depends on | Out of scope |
| --- | --- | --- | --- |
| **10C.4** | Zone staging **design** (this doc) | 10C.3A Rev 2 | Zone create, NS change |
| **10C.5** | Tunnel design (+ later impl) | Stable CF DNS preferred | Access, firewall |
| **10C.6** | Access for Coolify | Tunnel path | Portal/API Access |
| **10C.7** | Origin lockdown | Access for admin UX | Broad SSH redesign |
| **10C.8** | Firewall hardening | 10C.7 baseline | App code changes |
| **10C.9** | SSH hardening | Firewall + access model | DNS |

---

## Known Unknowns

### Requires Hostinger panel

- Full zone export (blocking)
- Dynamic apex representation / any ALIAS/CNAME pattern
- Hidden/inactive records (`mail`, `ftp`, SRV, etc.)
- DNSSEC toggle in Hostinger DNS UI
- Extra CAA / TXT not in AUTH DIG

### Requires Cloudflare dashboard

- Plan level (partial CNAME / SaaS eligibility — do not assume)
- Exact NS hostnames that will be assigned at zone create
- Account permissions for zone create
- Whether auto-scan would miss DYNAMIC apex semantics

### Requires Registrar

- Credential readiness
- DS records at registry (authoritative DNSSEC state)
- NS change UI / propagation expectations
- Support path for emergency NS revert

### Requires Operator decision

- Rollback owner identity
- Mail send/receive test window approval
- Formal approval of validation plan
- Purpose / owner of `staging.argos-it.com`
- Purpose of TXT `0x1608771ccaa6b895d53c24f023f6374c2f471878`
- Whether/when any hostname may become proxied
- Authorization to execute IMP-01…IMP-07

---

## Final Decision

### Status summary

| Item | Status |
| --- | --- |
| PHASE 10C.4 design document | Complete (Revision 1) |
| Infrastructure modified | **NO** |
| DNS modified | **NO** |
| Cloudflare modified | **NO** |
| Hostinger modified | **NO** |
| Zone creation | **NOT AUTHORIZED** |
| NS cutover | **NOT READY / NOT AUTHORIZED** |
| Authoritative inventory | Still **INCOMPLETE** (panel export blocking implementation) |
| Next action | Document review → then authorize implementation steps separately |

### Decision

**READY FOR DOCUMENT REVIEW**

Rationale: Zone staging architecture, full DNS table, proxy strategy, features matrix, dependency graph, validation/rollback/risk matrices, and roadmap 10C.4→10C.9 are complete and aligned with Migration Design Rev 2. Remaining gaps are **implementation gates and known unknowns**, not missing design sections. They correctly block zone create / NS cutover — not this design review.

STOP.
