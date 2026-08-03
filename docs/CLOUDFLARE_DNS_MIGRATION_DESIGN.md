# Cloudflare DNS Migration Design — argos-it.com

## 1. Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Document** | `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` |
| **Revision** | **2** |
| **Phase origin** | 10C.3A.1 (initial draft) |
| **Phase update** | 10C.3A.3 (document update from 10C.3A.2 inventory) |
| **Type** | DESIGN / DOCUMENTATION ONLY |
| **Inventory status** | AUTHORITATIVE INVENTORY **INCOMPLETE** (Hostinger panel export still required) |
| **Draft readiness** | READY |
| **Cutover readiness** | NOT READY |

### Revision history

| Rev | Phase | Change |
| --- | --- | --- |
| 1 | 10C.3A.1 | Initial DNS migration design draft |
| 2 | 10C.3A.3 | Incorporates authoritative dig inventory from 10C.3A.2; removes obsolete apex IPs; adds `staging`, DKIM CNAMEs, `autoconfig`; updates dynamic-record analysis and cutover gates |

### Planned phase order (documentation roadmap)

| Phase | Scope | Status |
| --- | --- | --- |
| 10C.3A.1–3 | DNS migration design + inventory alignment | This document (Rev 2) |
| **10C.4** | Cloudflare Zone Staging Design | Next (not authorized here) |
| **10C.5** | Cloudflare Tunnel | Deferred |
| **10C.6** | Cloudflare Access | Deferred |
| **10C.7** | Firewall / Origin Lockdown | Deferred |

---

## 2. Authority and non-authorization notice

This document is **design and documentation only**.

It does **not** authorize:

- creation of a Cloudflare DNS zone;
- nameserver changes at the registrar or Hostinger;
- creation, modification, or deletion of DNS records;
- enabling, disabling, or changing DNSSEC / DS records;
- Hostinger panel changes;
- installation of `cloudflared`;
- Cloudflare Tunnel creation;
- Cloudflare Access applications or policies;
- firewall, SSH, Docker, Coolify, or production changes;
- commits or pushes as part of operational cutover work.

No infrastructure or DNS was modified by producing Revision 2.

---

## 3. Objective

Define a safe path to:

1. maintain an accurate DNS inventory for `argos-it.com`;
2. design a **DNS-only** staging zone in Cloudflare that preserves all critical services;
3. define nameserver cutover, validation, and rollback;
4. keep Tunnel, Access, and origin/admin-port lockdown **out of** the DNS cutover itself.

Preferred architecture (strategic, not authorized here):

1. full authoritative DNS migration to Cloudflare first (**10C.4** staging, then cutover when gates pass);
2. then Cloudflare Tunnel (**10C.5**);
3. then Cloudflare Access for Coolify (**10C.6**);
4. then firewall / origin lockdown (**10C.7**).

**No nameserver cutover is authorized by this document.**

---

## 4. Current DNS authority

| Item | Value |
| --- | --- |
| Domain | `argos-it.com` |
| Authoritative nameservers | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| Registrar / DNS parking context | Hostinger |
| SOA (observed @ auth NS) | `ns1.dns-parking.com.` / `dns.hostinger.com.` · serial `2026080202` |
| Cloudflare as authoritative DNS for this domain | **Not active** |
| AXFR | Refused by Hostinger parking NS (expected) |

Original Hostinger NS to record before any future cutover:

- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

---

## 5. Current Cloudflare constraints

| Constraint | Status |
| --- | --- |
| Cloudflare account | Exists |
| Cloudflare R2 | Already used (e.g. production backups) |
| Active Cloudflare DNS zone for `argos-it.com` | No |
| Partial CNAME / Cloudflare-for-SaaS | **Must NOT be assumed** unless plan level is proven |
| `cloudflared` on VPS | Not installed |
| Tunnel | Deferred to **10C.5** |
| Access | Deferred to **10C.6** |

R2 continues independently of whether `argos-it.com` is a Cloudflare DNS zone.

---

## 6. DNS inventory (Revision 2)

### 6.1 Inventory labels and sources

| Label | Meaning |
| --- | --- |
| **AUTH DIG** | Answered by `@ns1.dns-parking.com` / `@ns2.dns-parking.com` (PHASE 10C.3A.2) |
| **PANEL REQUIRED** | Must be confirmed or completed via Hostinger DNS panel export |
| **DYNAMIC** | Value set is unstable / Hostinger-managed; do not pin stale dig snapshots |

**Status: AUTH DIG — NOT EXHAUSTIVE. Hostinger panel export remains mandatory before cutover.**

Obsolete Revision 1 apex A values (`77.37.50.37`, `193.58.105.161` and other one-shot dig snapshots) are **removed** as authoritative targets. See §6.3.

### 6.2 Stable records observed at authoritative NS

| Name | Type | Value | TTL | Preserve | Notes |
| --- | --- | --- | --- | --- | --- |
| `@` | NS | `ns1.dns-parking.com.` | 86400 | YES | Authority |
| `@` | NS | `ns2.dns-parking.com.` | 86400 | YES | Authority |
| `www` | CNAME | `www.argos-it.com.cdn.hstgr.net.` | 300 | YES | Hostinger CDN |
| `portal` | A | `91.108.121.181` | 14400 | YES | Public portal → Traefik/VPS |
| `api.portal` | A | `91.108.121.181` | 14400 | YES | Public API → Traefik/VPS |
| `coolify` | A | `91.108.121.181` | 14400 | YES | Coolify hostname → VPS |
| `staging` | A | `91.108.121.181` | 14400 | YES | **Added Rev 2** — staging host → VPS |
| `@` | MX | `5 mx1.hostinger.com.` | 14400 | YES | Mail |
| `@` | MX | `10 mx2.hostinger.com.` | 14400 | YES | Mail |
| `@` | TXT | `v=spf1 include:_spf.mail.hostinger.com ~all` | 3600 | YES | SPF (full value) |
| `@` | TXT | `MS=ms77525352` | 3600 | YES | Microsoft verification |
| `@` | TXT | `0x1608771ccaa6b895d53c24f023f6374c2f471878` | 3600 | YES | Purpose **UNKNOWN** — preserve until proven unused |
| `_dmarc` | TXT | `v=DMARC1; p=none` | 3600 | YES | DMARC |
| `autodiscover` | CNAME | `autodiscover.mail.hostinger.com.` | 300 | YES | Mail clients |
| `autoconfig` | CNAME | `autoconfig.mail.hostinger.com.` | 300 | YES | **Added Rev 2** |
| `hostingermail-a._domainkey` | CNAME | `hostingermail-a.dkim.mail.hostinger.com.` | 300 | YES | **Added Rev 2** — DKIM A |
| `hostingermail-b._domainkey` | CNAME | `hostingermail-b.dkim.mail.hostinger.com.` | 300 | YES | **Added Rev 2** — DKIM B |
| `hostingermail-c._domainkey` | CNAME | `hostingermail-c.dkim.mail.hostinger.com.` | 300 | YES | **Added Rev 2** — DKIM C |
| `@` | CAA | `0 issue "letsencrypt.org"` | 14400 | YES | Confirm full CAA set in panel |

### 6.3 Dynamic / Hostinger-managed apex records

| Name | Type | Behavior | TTL | Migration rule |
| --- | --- | --- | --- | --- |
| `@` | A | **DYNAMIC** — Hostinger web/CDN; multiple A; values rotated between 10C.3A.2 queries | 60 | **Do not** copy stale dig IPs into Cloudflare as permanent truth. At cutover, copy the **live Hostinger panel definition** (or Hostinger-prescribed ALIAS/CNAME pattern if documented). Re-query auth NS immediately before peer diff. |
| `@` | AAAA | **DYNAMIC** — Hostinger IPv6 pair observed; may rotate with A | 60 | Same rule as apex A. Full values at cutover from panel / live auth dig. |

**Example auth-dig snapshots (historical only — not cutover targets):**

- Mid-session: `147.79.116.152`, `77.37.50.72`
- Later (ns1=ns2): `147.79.116.122`, `193.58.105.78`
- Rev 1 draft (obsolete): `77.37.50.37`, `193.58.105.161`

### 6.4 Probed but not found at authoritative NS

Empty answers for common probes (not asserted absent from Hostinger UI):

`mail`, `smtp`, `imap`, `pop`, `pop3`, `webmail`, `ftp`, `cpanel`, `default._domainkey`, Microsoft `selector1/2._domainkey`, Google DKIM, common mail SRV, wildcard `*`, and several unused product hostnames.

**PANEL REQUIRED** for inactive/hidden Hostinger-only records.

### 6.5 DNSSEC note

**DNSSEC / DS status requires registrar and Hostinger panel verification.**

Read-only dig (10C.3A.2): no DNSKEY at auth NS; no DS at parent; no `AD` on recursive SOA.
This document does **not** claim DNSSEC is disabled or enabled.

---

## 7. Service-to-record mapping

| Service | Hostname(s) | DNS target | Must remain |
| --- | --- | --- | --- |
| Marketing / WordPress (Hostinger) | `@`, `www` | Hostinger dynamic A/AAAA + CDN CNAME | Public site continuity |
| Portal frontend | `portal.argos-it.com` | `91.108.121.181` (Traefik) | **Public** |
| Portal API | `api.portal.argos-it.com` | `91.108.121.181` (Traefik) | **Public** |
| Staging | `staging.argos-it.com` | `91.108.121.181` | Continuity (scope TBD with owner) |
| Coolify control-plane hostname | `coolify.argos-it.com` | `91.108.121.181` | Resolvable; Access in **10C.6** |
| Mail | MX, SPF, DMARC, DKIM CNAMEs, autodiscover, autoconfig | Hostinger mail | Mail continuity |
| Backups (R2) | N/A | Cloudflare R2 API | Unaffected by zone NS |

### Dependency map

```
Website (apex / www)
  → WordPress / Hostinger web + CDN
  → DYNAMIC apex A/AAAA + www CNAME
  → NS parking (Hostinger)

Portal (portal.argos-it.com)
  → Traefik (Coolify proxy)
  → 91.108.121.181

API (api.portal.argos-it.com)
  → Traefik
  → 91.108.121.181

Staging (staging.argos-it.com)
  → Traefik (assumed)
  → 91.108.121.181

Coolify (coolify.argos-it.com)
  → 91.108.121.181
  → native auth (now)
  → future Tunnel (10C.5) + Access (10C.6)

Mail
  → MX mx1/mx2.hostinger.com
  → SPF include:_spf.mail.hostinger.com
  → DKIM CNAMEs hostingermail-a|b|c → Hostinger DKIM
  → DMARC p=none
  → autodiscover / autoconfig → Hostinger mail
```

### Administrative surfaces (not DNS records)

| Surface | Notes |
| --- | --- |
| `:8000` | Coolify UI (direct port) — lockdown in **10C.7** |
| `:6001` / `:6002` | Realtime — **10C.7** |
| `:8080` | Traefik host publish — **10C.7** |
| `:22` | SSH — **10C.7** |

---

## 8. Mail safety requirements

- Copy **MX, SPF, DMARC, DKIM CNAMEs (`hostingermail-a|b|c._domainkey`), autodiscover, autoconfig** exactly from Hostinger before cutover.
- Never orange-cloud MX or mail-related records.
- DKIM is delegated via CNAME to Hostinger; do not invent local DKIM TXT.
- Preserve unknown apex TXT `0x1608771ccaa6b895d53c24f023f6374c2f471878` until purpose is proven.
- Plan authorized mail send/receive test window after cutover (separate approval).
- `mail` / `smtp` / `imap` / `pop` hostnames were **not** present in auth dig; confirm in panel.

---

## 9. Web/application safety requirements

- **Portal and API must remain public** (no Access on those hostnames during DNS migration).
- **Coolify native authentication must remain enabled**; Access is additive in **10C.6**.
- Preserve CAA for Let’s Encrypt / Traefik.
- Keep apex/`www` on Hostinger targets unless a separate WordPress migration is authorized.
- Initial CF design: all records **DNS-only (grey cloud)** until Tunnel/proxy design is approved.
- DNS cutover must **not** depend on Tunnel or Access.
- Include `staging.argos-it.com` in validation and peer diff.

---

## 10. Cloudflare DNS-only staging design

Target design (execution **not** authorized here; detailed in future **10C.4**):

1. Create Cloudflare zone `argos-it.com` (when authorized in 10C.4).
2. Populate from **Hostinger panel export** + live auth dig cross-check.
3. All records DNS-only (grey cloud) for staging and initial cutover.
4. For apex A/AAAA: follow Hostinger’s supported pattern (static copy of panel values at cutover time, or ALIAS/CNAME if Hostinger documents that). Never use obsolete Rev 1 IPs.
5. Include `staging`, `autoconfig`, and all three DKIM CNAMEs.
6. Do not assume partial CNAME setup unless plan level is proven.
7. Record Cloudflare-assigned NS for future registrar update.
8. Leave Hostinger NS authoritative until all pre-cutover gates pass.
9. Peer-diff Hostinger export vs Cloudflare zone before any NS change.
10. R2 remains independent of zone authority.

---

## 11. DNSSEC transition design

**DNSSEC / DS status requires registrar and Hostinger panel verification.**

Design rules for a future authorized window:

1. Confirm Hostinger DNSSEC toggle and registrar/registry DS.
2. If DS **present**: remove/disable DS **before** NS cutover; wait; cut over; optionally enable DNSSEC in Cloudflare later.
3. If DS **absent**: NS cutover without DS changes; optional CF DNSSEC later.
4. **No DNSSEC changes are authorized in 10C.3A.x.**

---

## 12. Future nameserver cutover sequence

**Not authorized now.**

1. Obtain full Hostinger DNS export (blocking).
2. Execute **10C.4** Cloudflare zone staging (DNS-only); complete peer diff.
3. Confirm DNSSEC/DS handling per §11.
4. Optionally lower high TTLs (14400 → lower) under separate authorization — especially MX/portal/api/coolify/staging/CAA.
5. Change nameservers at registrar/Hostinger from parking NS to Cloudflare NS.
6. Execute validation matrix (§13).
7. Keep Tunnel (**10C.5**), Access (**10C.6**), and port lockdown (**10C.7**) **out** of this cutover.
8. Only after stable DNS: schedule 10C.5 → 10C.6 → 10C.7.

---

## 13. Validation matrix

| Check | Method | Pass criteria |
| --- | --- | --- |
| NS authority | `dig NS` | Parking NS pre-cutover; Cloudflare NS post-cutover |
| Apex | `dig` + HTTPS | Hostinger site works; A/AAAA match Hostinger intent (dynamic OK if panel says so) |
| `www` | `dig` + HTTPS | CNAME to `www.argos-it.com.cdn.hstgr.net` preserved |
| `portal` | `dig A` + HTTPS | `91.108.121.181`; site reachable |
| `api.portal` | `dig` + `GET /api/health` | `91.108.121.181`; healthy |
| `staging` | `dig A` + HTTPS smoke | `91.108.121.181`; expected staging behavior |
| `coolify` | `dig A` + HTTPS | Resolves; Coolify login with **native auth** |
| MX | `dig MX` | Exact Hostinger MX |
| SPF / DMARC | `dig TXT` | Exact match |
| DKIM | `dig CNAME` on `hostingermail-a\|b\|c._domainkey` | Exact Hostinger CNAMEs |
| `autodiscover` / `autoconfig` | `dig CNAME` | Exact Hostinger CNAMEs |
| CAA | `dig CAA` | Matches panel; LE issuance OK |
| Mail | send/receive | Approved window only |

---

## 14. Rollback plan

| Trigger | Action |
| --- | --- |
| Incomplete/incorrect Cloudflare zone **before** cutover | Fix CF copy; **do not** change NS |
| Post-cutover web, API, portal, staging, or mail failure | Revert NS to `ns1.dns-parking.com` / `ns2.dns-parking.com` |
| DNSSEC / resolution failures | Restore prior NS and/or DS per registrar procedure |
| Uncertainty | Prefer NS rollback over emergency host changes |

Rollback for this DNS phase does **not** include Docker, firewall, SSH, Coolify, Tunnel, or Access changes.

---

## 15. Mandatory pre-cutover gates

Cutover readiness remains **NOT READY** until every gate is cleared under separate authorization.

| # | Gate | Status | Notes (Rev 2) |
| --- | --- | --- | --- |
| 1 | Full Hostinger DNS export obtained | **FAIL / BLOCKING** | Panel export not obtained in 10C.3A.2 |
| 2 | All records copied to Cloudflare DNS-only | PENDIENTE | Blocked by #1; awaits **10C.4** |
| 3 | Peer diff completed (Hostinger export vs Cloudflare zone) | **FAIL / BLOCKING** | No panel export to diff |
| 4 | MX / SPF / DKIM / DMARC verified | PENDIENTE | Auth dig verified core set; panel may add more |
| 5 | DNSSEC / DS status confirmed (registrar + Hostinger) | PENDIENTE | Dig empty; panel/registrar still required |
| 6 | Registrar credentials available | PENDIENTE | Not verified |
| 7 | Original Hostinger NS recorded | **PASS** | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| 8 | Portal / API / Coolify / staging / apex / www validation plan approved | PENDIENTE | Plan updated in Rev 2; formal approval not recorded |
| 9 | Mail send/receive test window approved | PENDIENTE | Not approved |
| 10 | Rollback owner identified | PENDIENTE | Not named |
| 11 | No Tunnel or Access dependency in the DNS cutover itself | **PASS** (design) | Enforced by phase order 10C.4 → 10C.5 → 10C.6 |
| 12 | Apex dynamic A/AAAA cutover method documented from Hostinger panel | PENDIENTE | **Added Rev 2** — required due to TTL 60 rotation |
| 13 | `staging`, `autoconfig`, and DKIM CNAMEs included in CF staging copy | PENDIENTE | **Added Rev 2** — content known via dig; CF copy not started |

---

## 16. Known unknowns

- Complete Hostinger panel zone (hidden/inactive records)
- Definitive DNSSEC toggle + registrar DS
- Hostinger-prescribed method to represent dynamic apex in Cloudflare
- Purpose of TXT `0x1608771ccaa6b895d53c24f023f6374c2f471878`
- Additional CAA (`issuewild`, `iodef`)
- PTR / reverse DNS for VPS and Hostinger IPs
- Cloudflare plan level
- Registrar credential readiness
- Rollback owner identity
- Service owner / purpose of `staging.argos-it.com`
- Any Google/Apple verification not visible in public DNS

---

## 17. Deferred phases

| Phase | Item | Notes |
| --- | --- | --- |
| **10C.4** | Cloudflare Zone Staging Design | Next documentation/design step after Rev 2 review |
| **10C.5** | Cloudflare Tunnel | After DNS authority stable |
| **10C.6** | Cloudflare Access (Coolify) | After Tunnel; native auth remains |
| **10C.7** | Firewall / Origin Lockdown | `:8000`, `:6001`/`:6002`, `:8080`, `:22` |
| — | Orange-cloud / proxied records | Not part of initial DNS-only design |
| — | WordPress / apex off Hostinger | Separate decision |

---

## 18. Final document status

PHASE 10C.3A.3

DNS MIGRATION DESIGN DOCUMENT — REVISION 2

Status:
UPDATED

Draft Readiness:
READY

Cutover Readiness:
NOT READY

Authoritative Inventory:
INCOMPLETE (Hostinger panel export blocking)

Infrastructure Modified:
NO

DNS Modified:
NO

Cloudflare Modified:
NO

Hostinger Modified:
NO

Next Authorized Action:
DOCUMENT REVIEW → then **10C.4 Cloudflare Zone Staging Design**

STOP.
