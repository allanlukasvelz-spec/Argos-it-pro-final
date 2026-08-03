# Cloudflare DNS Migration Design — argos-it.com

## 1. Document Control

| Field | Value |
| --- | --- |
| **Project** | ARGOS-IT |
| **Repository** | Argos-it-pro-final |
| **Branch context** | `deploy/production-v1` |
| **Phase** | 10C.3A.1 |
| **Document** | `docs/CLOUDFLARE_DNS_MIGRATION_DESIGN.md` |
| **Type** | DESIGN / DOCUMENTATION ONLY |
| **Related phase** | 10C.3A — Cloudflare Access (deferred; not this document) |
| **Draft readiness** | READY |
| **Cutover readiness** | NOT READY |

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
- commits or pushes as part of this phase’s operational work.

No infrastructure or DNS was modified by producing this document.

---

## 3. Objective

Define a safe path to:

1. inventory the current authoritative DNS for `argos-it.com`;
2. design a **DNS-only** staging zone in Cloudflare that preserves all critical services;
3. define nameserver cutover, validation, and rollback;
4. keep Tunnel, Access, and origin/admin-port lockdown **out of** the DNS cutover itself.

Preferred architecture (strategic, not authorized here):

1. full authoritative DNS migration to Cloudflare first;
2. then Cloudflare Tunnel + Access for Coolify (later phase);
3. then origin/admin-port lockdown (later phase).

**No nameserver cutover is authorized by this document.**

---

## 4. Current DNS authority

| Item | Value |
| --- | --- |
| Domain | `argos-it.com` |
| Authoritative nameservers (observed) | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| Registrar / DNS parking context | Hostinger |
| SOA (observed) | `ns1.dns-parking.com` / `dns.hostinger.com` · serial `2026080202` |
| Cloudflare as authoritative DNS for this domain | **Not active** |

Original Hostinger NS to record before any future cutover:

- `ns1.dns-parking.com`
- `ns2.dns-parking.com`

---

## 5. Current Cloudflare constraints

| Constraint | Status |
| --- | --- |
| Cloudflare account | Exists |
| Cloudflare R2 | Already used (e.g. production backups bucket) |
| Active Cloudflare DNS zone for `argos-it.com` | No |
| Partial CNAME / Cloudflare-for-SaaS | **Must NOT be assumed** unless plan level is proven |
| `cloudflared` on VPS | Not installed |
| Tunnel | Not in scope for 10C.3A.1 |
| Access | Not in scope for 10C.3A.1 |

R2 continues to operate independently of whether `argos-it.com` is a Cloudflare DNS zone.

---

## 6. Publicly observed DNS inventory

**Label: PUBLICLY OBSERVED — NOT EXHAUSTIVE**

Source: public `dig` against the live zone / recursive resolvers.
**A full Hostinger panel export remains mandatory** before any cutover.

Do **not** treat this table as a complete zone file. Hidden or panel-only records (additional TXT, DKIM selectors, SRV, extra AAAA, etc.) may exist.

| Name | Type | Observed value / note | Preserve |
| --- | --- | --- | --- |
| `@` | A | Hostinger apex IPs observed publicly (multiple A) | YES — copy exact set from Hostinger |
| `@` | AAAA | Hostinger IPv6 observed publicly | YES if present in panel — **PENDIENTE — copiar valor completo desde Hostinger** |
| `www` | CNAME | `www.argos-it.com.cdn.hstgr.net` | YES |
| `portal` | A | `91.108.121.181` | YES |
| `api.portal` | A | `91.108.121.181` | YES |
| `coolify` | A | `91.108.121.181` | YES |
| `@` | MX | `5 mx1.hostinger.com.` · `10 mx2.hostinger.com.` | YES |
| `@` | TXT (SPF) | `v=spf1 include:_spf.mail.hostinger.com ~all` | YES |
| `@` | TXT (Microsoft) | `MS=ms77525352` | YES |
| `@` | TXT (other) | Truncated/unknown purpose hex-like TXT observed | YES until proven unused — **PENDIENTE — copiar valor completo desde Hostinger** |
| `_dmarc` | TXT | `v=DMARC1; p=none` | YES |
| DKIM (`*._domainkey`) | TXT | Not reliably observed via public dig for `default._domainkey` | **PENDIENTE — copiar valor completo desde Hostinger** |
| `autodiscover` | CNAME | `autodiscover.mail.hostinger.com` | YES if mail is used |
| `@` | CAA | `0 issue "letsencrypt.org"` observed | YES — confirm full CAA set in panel — **PENDIENTE — copiar valor completo desde Hostinger** |
| SRV / other | * | Not inventoried via public dig | **PENDIENTE — copiar valor completo desde Hostinger** |

### DNSSEC note

**DNSSEC / DS status requires registrar and Hostinger panel verification.**

This document does **not** claim DNSSEC is disabled or enabled. Public dig without an `AD` flag is **not** proof of registry state.

---

## 7. Service-to-record mapping

| Service | Hostname(s) | DNS target class | Must remain |
| --- | --- | --- | --- |
| Marketing / WordPress (Hostinger) | `@`, `www` | Hostinger web / CDN | Public site continuity |
| Portal frontend | `portal.argos-it.com` | VPS `91.108.121.181` | **Public** |
| Portal API | `api.portal.argos-it.com` | VPS `91.108.121.181` | **Public** |
| Coolify control-plane hostname | `coolify.argos-it.com` | VPS `91.108.121.181` | Resolvable; Access later |
| Mail | MX + SPF + DMARC + DKIM + autodiscover | Hostinger mail | Mail continuity |
| Backups (R2) | N/A (object storage API) | Cloudflare R2 | Unaffected by zone NS |

### Administrative surfaces (context only — not DNS records)

These are **not** migrated by DNS cutover and must not be treated as DNS work:

| Surface | Notes |
| --- | --- |
| `:8000` | Coolify UI (direct port) |
| `:6001` / `:6002` | Realtime |
| `:8080` | Traefik host publish |
| `:22` | SSH |

Origin/admin-port lockdown is a **deferred** phase.

---

## 8. Mail safety requirements

- Export and copy **MX, SPF, DMARC, DKIM, autodiscover**, and any `mail.*` records **exactly** from Hostinger before cutover.
- Never enable Cloudflare proxy (orange cloud) on MX or mail-related records.
- Do not invent DKIM selectors or TXT values; copy from panel.
- Plan an authorized mail send/receive test window after cutover (separate approval).
- Treat any unknown apex TXT as **preserve until proven disposable**.

---

## 9. Web/application safety requirements

- **Portal and API must remain public** (no Access on those hostnames as part of DNS migration).
- **Coolify native authentication must remain enabled**; Cloudflare Access is additive in a later phase, not a replacement in 10C.3A.1.
- Preserve CAA records required for Let’s Encrypt / Traefik certificate issuance.
- Keep apex/`www` on Hostinger targets unless a separate WordPress migration is authorized.
- For DNS-only staging and initial post-cutover state: keep application hostnames **DNS-only (grey cloud)** until a later Tunnel/proxy design is approved.
- Do not introduce Tunnel or Access as a dependency of the DNS cutover itself.

---

## 10. Cloudflare DNS-only staging design

Target design (execution **not** authorized by this document):

1. Create Cloudflare zone `argos-it.com` (when separately authorized).
2. Populate the zone with a **complete** copy of Hostinger records.
3. Set **all** records to DNS-only (proxy off / grey cloud) for the staging and initial cutover design.
4. Do not assume partial CNAME setup unless Cloudflare plan level is proven and documented.
5. Record the Cloudflare-assigned nameservers (`*.ns.cloudflare.com`) for a future registrar update.
6. Leave Hostinger NS authoritative until mandatory pre-cutover gates are complete.
7. Peer-diff Hostinger export vs Cloudflare zone before any NS change.
8. R2 remains independent of zone authority.

---

## 11. DNSSEC transition design

**DNSSEC / DS status requires registrar and Hostinger panel verification.**

Design rules for a future authorized window:

1. Confirm whether DNSSEC is enabled at Hostinger and whether DS records exist at the registrar/registry.
2. If DNSSEC / DS **is** present: remove or disable DS **before** nameserver cutover; wait for propagation; then cut over NS; optionally re-enable DNSSEC in Cloudflare afterward.
3. If DNSSEC / DS **is not** present: proceed with NS cutover without DS changes; optional Cloudflare DNSSEC enablement later.
4. **No DNSSEC changes are authorized in PHASE 10C.3A.1.**

---

## 12. Future nameserver cutover sequence

**Not authorized now.** Sequence for a future dual-authorized change window:

1. Obtain full Hostinger DNS export (mandatory).
2. Create/populate Cloudflare zone DNS-only; complete peer diff.
3. Confirm DNSSEC/DS handling per §11.
4. Optionally lower TTLs (separate authorization).
5. Change nameservers at registrar/Hostinger from parking NS to Cloudflare NS.
6. Execute validation matrix (§13).
7. Keep Tunnel, Access, and port lockdown **out** of this cutover.
8. Only after stable DNS: schedule later phases (Tunnel/Access, then origin lockdown).

---

## 13. Validation matrix

| Check | Method | Pass criteria |
| --- | --- | --- |
| NS authority | `dig NS argos-it.com` | Expected NS for the stage (Hostinger parking pre-cutover; Cloudflare post-cutover) |
| Apex | `dig` + HTTPS | Hostinger marketing site resolves as designed |
| `www` | `dig` + HTTPS | CNAME/CDN behavior preserved |
| `portal` | `dig A` + HTTPS | Points to expected VPS IP; site reachable |
| `api.portal` | `dig` + `GET /api/health` | Expected IP; healthy API response |
| `coolify` | `dig A` + HTTPS | Resolves; Coolify login works with **native auth** |
| MX | `dig MX` | Exact Hostinger MX preserved |
| SPF / DMARC / DKIM | `dig TXT` | Exact match to Hostinger export |
| CAA | `dig CAA` | Matches panel export; LE issuance not broken |
| Mail | send/receive test | Only in an approved window |

---

## 14. Rollback plan

| Trigger | Action |
| --- | --- |
| Incomplete/incorrect Cloudflare zone **before** cutover | Fix Cloudflare copy; **do not** change nameservers |
| Post-cutover web, API, portal, or mail failure | Revert nameservers to `ns1.dns-parking.com` and `ns2.dns-parking.com` |
| DNSSEC / resolution failures after cutover | Restore prior NS and/or DS per registrar procedure |
| Uncertainty | Prefer NS rollback over emergency production host changes |

Rollback for this DNS phase does **not** include Docker, firewall, SSH, Coolify, Tunnel, or Access changes.

---

## 15. Mandatory pre-cutover gates

All gates start as **PENDIENTE**. Cutover readiness remains **NOT READY** until every gate is explicitly cleared under a separate authorization.

| # | Gate | Status |
| --- | --- | --- |
| 1 | Full Hostinger DNS export obtained | PENDIENTE |
| 2 | All records copied to Cloudflare DNS-only | PENDIENTE |
| 3 | Peer diff completed (Hostinger export vs Cloudflare zone) | PENDIENTE |
| 4 | MX / SPF / DKIM / DMARC verified | PENDIENTE |
| 5 | DNSSEC / DS status confirmed (registrar + Hostinger) | PENDIENTE |
| 6 | Registrar credentials available | PENDIENTE |
| 7 | Original Hostinger NS recorded (`ns1.dns-parking.com`, `ns2.dns-parking.com`) | PENDIENTE |
| 8 | Portal / API / Coolify / apex / www validation plan approved | PENDIENTE |
| 9 | Mail send/receive test window approved | PENDIENTE |
| 10 | Rollback owner identified | PENDIENTE |
| 11 | No Tunnel or Access dependency in the DNS cutover itself | PENDIENTE |

---

## 16. Known unknowns

- Complete Hostinger zone contents beyond public dig (DKIM, SRV, extra TXT/AAAA).
- Definitive DNSSEC / DS state at registrar and Hostinger.
- Cloudflare plan level (partial CNAME / advanced DNS features).
- Whether every observed apex A/AAAA is required vs Hostinger auto-managed CDN set.
- Full exact value and purpose of non-SPF/non-MS apex TXT observed publicly.
- Whether additional admin or service hostnames exist beyond `coolify`.
- Exact Coolify version pin (operational, not DNS-blocking for drafting).

---

## 17. Deferred phases

Out of scope for PHASE 10C.3A.1 (DNS migration design):

| Deferred item | Notes |
| --- | --- |
| Cloudflare Tunnel | After DNS authority is stable |
| Cloudflare Access for Coolify | After Tunnel design; Coolify native auth remains |
| Orange-cloud / proxied records | Not part of initial DNS-only design |
| Origin/admin-port lockdown | `:8000`, `:6001`/`:6002`, `:8080`, `:22` — separate phase |
| WordPress / apex migration off Hostinger | Separate decision |

---

## 18. Final document status

PHASE 10C.3A.1

DNS MIGRATION DESIGN DOCUMENT

Status:
DRAFT CREATED

Draft Readiness:
READY

Cutover Readiness:
NOT READY

Infrastructure Modified:
NO

DNS Modified:
NO

Next Authorized Action:
DOCUMENT REVIEW ONLY

STOP.
