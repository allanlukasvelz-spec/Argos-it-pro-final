#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ARGOS-IT local web audit — HTTP + static HTML checks (SSR/SSG only).

Analyzes HTML as returned by the server; JavaScript hydration is NOT executed.

Dependencies:
    pip install requests beautifulsoup4

    O instalación sólo para este repo:
    pip install --target=.pydeps -r scripts/requirements-audit.txt

Usage:
    python3 scripts/audit_web.py
    python3 scripts/audit_web.py --base-url http://127.0.0.1:3001

Environment:
    ARGOS_AUDIT_BASE_URL  — default base URL if --base-url omitted
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import defaultdict
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

REPO_ROOT = Path(__file__).resolve().parent.parent
REPORTS_DIR = REPO_ROOT / "reports"

# Opción local: pip install --target=.pydeps -r scripts/requirements-audit.txt
_pydeps = REPO_ROOT / ".pydeps"
if _pydeps.is_dir():
    sys.path.insert(0, str(_pydeps))

try:
    import requests
except ImportError:  # pragma: no cover
    sys.stderr.write("Missing dependency: requests\nInstall with: pip install requests beautifulsoup4\n")
    sys.exit(2)

try:
    from bs4 import BeautifulSoup
except ImportError:  # pragma: no cover
    sys.stderr.write("Missing dependency: beautifulsoup4\nInstall with: pip install requests beautifulsoup4\n")
    sys.exit(2)

DEFAULT_BASE_URL = os.environ.get("ARGOS_AUDIT_BASE_URL", "http://127.0.0.1:3001")

AUDIT_ROUTES = [
    "/",
    "/metodo",
    "/metodo/analizar",
    "/metodo/reforzar",
    "/metodo/guiar",
    "/metodo/optimizar",
    "/metodo/supervisar",
    "/servicios",
    "/contacto",
    "/sobre-argos-it",
    "/auth/login",
    "/auth/register",
    "/privacidad",
    "/cookies",
    "/aviso-legal",
]

# Expected HTTP status per route (all public pages should be 200 in dev)
EXPECTED_STATUS: dict[str, int] = {route: 200 for route in AUDIT_ROUTES}

PERF_HTML_BYTES_WARN = 500 * 1024
PERF_SCRIPT_COUNT_WARN = 25

ROUTE_HINTS: dict[str, str] = {
    "/": "frontend/app/page.tsx",
    "/metodo": "frontend/app/metodo/page.tsx",
    "/metodo/analizar": "frontend/app/metodo/[slug]/page.tsx",
    "/metodo/reforzar": "frontend/app/metodo/[slug]/page.tsx",
    "/metodo/guiar": "frontend/app/metodo/[slug]/page.tsx",
    "/metodo/optimizar": "frontend/app/metodo/[slug]/page.tsx",
    "/metodo/supervisar": "frontend/app/metodo/[slug]/page.tsx",
    "/servicios": "frontend/app/servicios/page.tsx",
    "/contacto": "frontend/app/contacto/page.tsx",
    "/sobre-argos-it": "frontend/app/sobre-argos-it/page.tsx",
    "/auth/login": "frontend/app/auth/login/page.tsx",
    "/auth/register": "frontend/app/auth/register/page.tsx",
    "/privacidad": "frontend/app/privacidad/page.tsx",
    "/cookies": "frontend/app/cookies/page.tsx",
    "/aviso-legal": "frontend/app/aviso-legal/page.tsx",
}

USER_AGENT = "ARGOS-IT-Audit/1.0 (+local python requests)"


@dataclass
class Finding:
    severity: str  # critical, medium, minor
    route: str
    type: str
    description: str
    element: str = ""
    related_file: str = ""
    recommendation: str = ""

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v}


@dataclass
class PageResult:
    route: str
    url: str
    status_code: int | None
    elapsed_ms: float | None
    html_bytes: int
    redirect_url: str | None
    script_tags: int
    link_stylesheets: int


def relate_file(route: str) -> str:
    return ROUTE_HINTS.get(route) or ROUTE_HINTS.get("/")


def normalize_url(base: str, href: str) -> str | None:
    if not href or href.strip().startswith(("javascript:", "mailto:", "tel:")):
        return None
    return urljoin(base.rstrip("/") + "/", href)


def visible_text_simple(el) -> str:
    if el is None:
        return ""
    return el.get_text(" ", strip=True) or ""


def is_internal(url: str, base_netloc: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme in ("", "http", "https") and (not parsed.netloc or parsed.netloc == base_netloc):
        return True
    return parsed.netloc == base_netloc


class LinkChecker:
    def __init__(self, session: requests.Session, base_origin: str, base_netloc: str):
        self.session = session
        self.base_origin = base_origin.rstrip("/")
        self.base_netloc = base_netloc
        self.cache: dict[str, tuple[bool, str]] = {}

    def check_internal(self, full_url: str) -> tuple[bool, str]:
        if full_url in self.cache:
            return self.cache[full_url]
        parsed = urlparse(full_url)
        path = parsed.path or "/"
        # Skip Next.js internals and hashed assets that may need cookie
        if path.startswith("/_next/") or path.startswith("/api/"):
            self.cache[full_url] = (True, "skipped-internal-next")
            return self.cache[full_url]

        ok = False
        msg = ""
        try:
            r = self.session.head(full_url, allow_redirects=True, timeout=8)
            if r.status_code == 405 or r.status_code == 404:
                r = self.session.get(full_url, stream=True, timeout=15)
                try:
                    for _ in r.iter_content(chunk_size=4096):
                        break
                finally:
                    r.close()
            ok = r.status_code < 400
            msg = f"HTTP {r.status_code}"
            if getattr(r, "url", "") and urlparse(full_url)._replace(fragment="").geturl().rstrip(
                "/"
            ) != urlparse(r.url)._replace(fragment="").geturl().rstrip("/"):
                msg += " (redirected)"

        except requests.RequestException as e:
            msg = str(e)[:180]
            ok = False

        self.cache[full_url] = (ok, msg)
        return ok, msg


def audit_route(
    route: str,
    base_url: str,
    session: requests.Session,
    link_checker: LinkChecker,
) -> tuple[PageResult, list[Finding], BeautifulSoup | None]:
    findings: list[Finding] = []
    full_url = base_url.rstrip("/") + (route if route.startswith("/") else "/" + route)
    html_bytes = 0
    status_code: int | None = None
    elapsed_ms = None
    redirect_url = None
    soup = None

    try:
        t0 = datetime.now(timezone.utc)
        resp = session.get(full_url, allow_redirects=True, timeout=30)
        elapsed_ms = (datetime.now(timezone.utc) - t0).total_seconds() * 1000
        if resp.history:
            start_path = urlparse(full_url).path.rstrip("/") or "/"
            end_path = urlparse(resp.url).path.rstrip("/") or "/"
            if start_path != end_path:
                chain = " -> ".join(
                    (hist.headers.get("Location") or hist.url or "")[:100] for hist in resp.history[:5]
                )
                redirect_url = chain
                findings.append(
                    Finding(
                        "medium",
                        route,
                        "http_redirect",
                        (
                            f"La petición siguió {len(resp.history)} redireccion(es)"
                            f" (path {start_path!r} → {end_path!r}): {chain[:200]}"
                        ),
                        related_file=relate_file(route),
                        recommendation="Verifica que canonical y enlaces apuntan al destino final sin cadenas innecesarias.",
                    )
                )
        status_code = resp.status_code
        body = resp.text or ""
        html_bytes = len(body.encode("utf-8"))

        expected = EXPECTED_STATUS.get(route, 200)
        if status_code != expected:
            sev = "critical" if status_code and status_code >= 400 else "critical"
            findings.append(
                Finding(
                    sev,
                    route,
                    "http_status",
                    f"Esperado {expected}, obtenido {status_code}",
                    related_file=relate_file(route),
                    recommendation="Revisa la ruta, middleware y errores SSR en esa pagina.",
                )
            )

        if status_code != 200 or not body.strip():
            return (
                PageResult(
                    route,
                    full_url,
                    status_code,
                    elapsed_ms,
                    html_bytes,
                    redirect_url,
                    0,
                    0,
                ),
                findings,
                None,
            )

        soup = BeautifulSoup(body, "html.parser")
    except requests.RequestException as e:
        findings.append(
            Finding(
                "critical",
                route,
                "http_error",
                f"No se pudo obtener la página: {e}",
                related_file=relate_file(route),
                recommendation="Arranca Next dev en el puerto correcto (p. ej. npm run dev y --port 3001 si aplica).",
            )
        )
        return (
            PageResult(route, full_url, None, None, 0, None, 0, 0),
            findings,
            None,
        )

    assert soup is not None

    base_netloc = urlparse(base_url).netloc
    script_tags = len(soup.find_all("script"))
    link_stylesheets = len([l for l in soup.find_all("link", rel=True) if "stylesheet" in (l.get("rel") or [])])

    ids_on_page = {el.get("id") for el in soup.find_all(id=True)}
    anchors = soup.find_all("a", href=True)

    for a in anchors:
        href = (a.get("href") or "").strip()
        if href == "":
            findings.append(
                Finding(
                    "medium",
                    route,
                    "link_empty_href",
                    "Enlace con href vacio",
                    element=f"<a class={a.get('class')!r}>",
                    related_file=relate_file(route),
                    recommendation="Añade una URL destino o usa <button> con semantica adecuada.",
                )
            )
            continue
        if href == "#":
            findings.append(
                Finding(
                    "medium",
                    route,
                    "link_hash_href",
                    "Enlace con href=\"#\" sin destino especifico",
                    element=visible_text_simple(a)[:80] or "<a>",
                    related_file=relate_file(route),
                    recommendation="Si es placeholder, usar boton real o enlace al fragmento (#id existente).",
                )
            )
            continue

        full = normalize_url(full_url, href)
        if not full:
            continue

        parsed = urlparse(full)
        if parsed.fragment and parsed.path == urlparse(full_url).path and href.startswith("#"):
            frag = parsed.fragment
            if frag and frag not in ids_on_page:
                findings.append(
                    Finding(
                        "medium",
                        route,
                        "link_fragment_missing",
                        f"fragmento #{frag} sin id en la pagina",
                        element=f'href="{href}"',
                        related_file=relate_file(route),
                        recommendation="Define el elemento con id esperado o corrige la URL.",
                    )
                )
            continue

        if is_internal(full, base_netloc):
            ok, detail = link_checker.check_internal(full)
            if not ok:
                findings.append(
                    Finding(
                        "critical",
                        route,
                        "broken_internal_link",
                        f"Enlace interno falla: {full} ({detail})",
                        element=f'href="{href}"',
                        related_file=relate_file(route),
                        recommendation="Corrige href o crea la ruta en Next/App Router.",
                    )
                )

        if not visible_text_simple(a) and not a.get("aria-label") and not a.get("aria-labelledby"):
            findings.append(
                Finding(
                    "minor",
                    route,
                    "link_no_accessible_text",
                    "Enlace sin texto visible ni aria-label",
                    element=f'href="{href}"',
                    related_file=relate_file(route),
                    recommendation="Añade texto descriptivo o aria-label.",
                )
            )

    for img in soup.find_all("img"):
        src = img.get("src") or ""
        alt = img.get("alt")

        if not src.strip():
            findings.append(
                Finding(
                    "critical",
                    route,
                    "image_missing_src",
                    "Etiqueta <img> sin src",
                    related_file=relate_file(route),
                    recommendation="Proporciona src o usa next/image correctamente.",
                )
            )
        elif src.startswith("data:"):
            pass
        else:
            img_url = normalize_url(full_url, src.split("?")[0])
            if img_url and is_internal(img_url, base_netloc):
                ok, detail = link_checker.check_internal(img_url)
                if not ok:
                    findings.append(
                        Finding(
                            "medium",
                            route,
                            "broken_image",
                            f"Imagen potencialmente rota: {img_url} ({detail})",
                            element=f"src={src[:120]}",
                            related_file=relate_file(route),
                            recommendation="Comprueba que el archivo existe en public/ o en el origen CDN.",
                        )
                    )

        if alt is None:
            findings.append(
                Finding(
                    "medium",
                    route,
                    "image_missing_alt",
                    "img sin atributo alt (usa alt vacio \"\" si es decorativo)",
                    element=f"src={src[:100]}",
                    related_file=relate_file(route),
                    recommendation='Añade alt descriptivo o alt="" si es puramente decorativo.',
                )
            )

    for form in soup.find_all("form"):
        action = form.get("action")
        method = (form.get("method") or "get").lower()
        submit_exists = (
            len(form.select('button[type="submit"]'))
            + len(form.select('input[type="submit"]'))
            + len(form.select('button:not([type])'))
        )

        msg_parts = []
        if action is None:
            msg_parts.append("sin atributo action")
        elif action.strip() == "":
            msg_parts.append("action vacío (usual en SPA)")

        controls = []
        controls.extend(form.find_all("input"))
        controls.extend(form.find_all("select"))
        controls.extend(form.find_all("textarea"))
        unnamed = []
        for c in controls:
            ctype = (c.get("type") or "text").lower()
            tag = c.name.lower()
            if tag != "textarea" and ctype in {"submit", "button", "hidden", "image"}:
                continue
            if not c.get("name"):
                unnamed.append(tag)

        if unnamed:
            findings.append(
                Finding(
                    "medium",
                    route,
                    "form_missing_input_name",
                    f"Inputs sin name: {len(unnamed)} elemento(s)",
                    related_file=relate_file(route),
                    recommendation="Cada campo que se envía debe tener name (o usar handler JS documentado fuera del alcance SSR).",
                )
            )

        if submit_exists == 0 and method == "post":
            findings.append(
                Finding(
                    "medium",
                    route,
                    "form_no_submit",
                    "Form POST sin boton/input submit evidente",
                    related_file=relate_file(route),
                    recommendation="Verifica patron de envio React o anyade type=submit donde corresponda.",
                )
            )

        if msg_parts and method == "get":
            findings.append(
                Finding(
                    "minor",
                    route,
                    "form_action_ambiguous",
                    "Formulario GET: " + ", ".join(msg_parts),
                    related_file=relate_file(route),
                    recommendation="Para multi-pagina, define action explicita; SPA puede omitirlo.",
                )
            )

        for lbl in form.find_all("label"):
            fid = lbl.get("for")
            if fid:
                if not form.find(attrs={"id": fid}):
                    findings.append(
                        Finding(
                            "minor",
                            route,
                            "label_for_orphan",
                            f'label for="{fid}" sin control con ese id en el formulario',
                            related_file=relate_file(route),
                            recommendation="Asocia el id del input al atributo for del label.",
                        )
                    )

        for c in controls:
            tag = c.name
            if not tag:
                continue
            ctype = (c.get("type") or "text").lower()
            if ctype in {"hidden", "submit", "button", "image", "range"}:
                continue
            if c.get("aria-label") or c.get("aria-labelledby"):
                continue
            cid = c.get("id")
            labelled = bool(cid and form.find("label", attrs={"for": cid}))
            if c.find_parent("label"):
                labelled = True
            if not labelled:
                findings.append(
                    Finding(
                        "minor",
                        route,
                        "input_no_label_association",
                        f"Campo <{tag}> ({ctype}) sin label asociado obvio",
                        related_file=relate_file(route),
                        recommendation="Asocia label con for+id o envuelve el control en label.",
                    )
                )

    title_tag = soup.find("title")
    title_text = title_tag.get_text(strip=True) if title_tag else ""
    if not title_text.strip():
        findings.append(
            Finding(
                "critical",
                route,
                "seo_missing_title",
                "Sin <title> o title vacío",
                related_file=relate_file(route),
                recommendation="Define metadata.title en Next o un <title> en el layout.",
            )
        )

    meta_desc = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    meta_content = ""
    if meta_desc and meta_desc.get("content"):
        meta_content = meta_desc["content"].strip()
    if not meta_content:
        findings.append(
            Finding(
                "medium",
                route,
                "seo_missing_meta_description",
                "Falta meta name=description o content vacío",
                related_file=relate_file(route),
                recommendation="Añade description en Metadata de la pagina o layout.",
            )
        )

    h1_tags = soup.find_all("h1")
    if not h1_tags:
        findings.append(
            Finding(
                "critical",
                route,
                "seo_missing_h1",
                "No hay elemento <h1> en el HTML renderizado",
                related_file=relate_file(route),
                recommendation="Introduce exactamente un h1 visible principal por pagina (salvo caso excepcional).",
            )
        )
    elif len(h1_tags) > 1:
        findings.append(
            Finding(
                "medium",
                route,
                "seo_multiple_h1",
                f"Hay {len(h1_tags)} elementos <h1> — convencion: uno por pagina",
                related_file=relate_file(route),
                recommendation="Usa h2/h3 para titulos secundarios y deja un solo h1.",
            )
        )

    for btn in soup.find_all("button"):
        if not visible_text_simple(btn) and not btn.get("aria-label") and not btn.get("aria-labelledby"):
            findings.append(
                Finding(
                    "medium",
                    route,
                    "a11y_button_no_name",
                    "Boton sin texto visible ni nombre accesible",
                    element=str(btn.attrs)[:120],
                    related_file=relate_file(route),
                    recommendation="Añade texto, aria-label o aria-labelledby.",
                )
            )

    modal_seen = set()
    for node in soup.select('[role="dialog"], [aria-modal="true"]'):
        oid = id(node)
        if oid in modal_seen:
            continue
        modal_seen.add(oid)
        if node.get("role") == "dialog" or (node.get("aria-modal") or "").lower() == "true":
            if not node.get("aria-label") and not node.get("aria-labelledby"):
                findings.append(
                    Finding(
                        "minor",
                        route,
                        "a11y_dialog_missing_name",
                        "Dialog/modal sin aria-label ni aria-labelledby",
                        related_file=relate_file(route),
                        recommendation="Describe el proposito del dialogo para lectores de pantalla.",
                    )
                )

    if html_bytes > PERF_HTML_BYTES_WARN:
        findings.append(
            Finding(
                "minor",
                route,
                "perf_large_html",
                f"HTML ~{html_bytes / 1024:.0f} KB (umbral {PERF_HTML_BYTES_WARN // 1024} KB)",
                related_file=relate_file(route),
                recommendation="Revisa componentes que inyecten mucho markup en SSR.",
            )
        )
    if script_tags > PERF_SCRIPT_COUNT_WARN:
        findings.append(
            Finding(
                "minor",
                route,
                "perf_many_scripts",
                f"{script_tags} etiquetas <script> (umbral {PERF_SCRIPT_COUNT_WARN})",
                related_file=relate_file(route),
                recommendation="Next puede fragmentar chunks; valida en Network si es ruido o problema real.",
            )
        )

    return (
        PageResult(
            route,
            full_url,
            status_code,
            elapsed_ms,
            html_bytes,
            redirect_url,
            script_tags,
            link_stylesheets,
        ),
        findings,
        soup,
    )


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_markdown(path: Path, summary: dict, findings: list[Finding], pages: list[PageResult]) -> None:
    by_sev = defaultdict(list)
    for f in findings:
        by_sev[f.severity].append(f)

    lines = [
        "# ARGOS-IT — Auditoría web local",
        "",
        f"Generado (UTC): `{summary['generated_at']}`",
        f"Base URL: `{summary['base_url']}`",
        "",
        "**Nota:** este informe usa solo HTML estático SSR/SSG. No ejecuta JavaScript.",
        "",
        "## Resumen",
        "",
        "| Métrica | Valor |",
        "|---------|-------|",
        f"| Páginas auditadas | {summary['pages_audited']} |",
        f"| Críticos | {summary['critical_count']} |",
        f"| Medios | {summary['medium_count']} |",
        f"| Menores | {summary['minor_count']} |",
        "",
    ]

    if pages:
        lines.extend(
            [
                "## Páginas",
                "",
                "| Ruta | HTTP | Tiempo(ms) | HTML KB | Scripts | CSS |",
                "|------|------|-------------|---------|---------|-----|",
            ]
        )
        for p in pages:
            ms = f"{p.elapsed_ms:.0f}" if p.elapsed_ms is not None else "—"
            st = str(p.status_code) if p.status_code is not None else "—"
            hk = f"{p.html_bytes / 1024:.1f}" if p.html_bytes else "0"
            lines.append(f"| `{p.route}` | {st} | {ms} | {hk} | {p.script_tags} | {p.link_stylesheets} |")

    lines.append("")
    lines.append(f"Para instalar deps: `pip install requests beautifulsoup4` (ver también `scripts/requirements-audit.txt`).")
    lines.append("")

    for label, severity in (
        ("## Críticos", "critical"),
        ("## Medios", "medium"),
        ("## Menores", "minor"),
    ):
        lines.extend(["", label, ""])
        items = by_sev.get(severity, [])
        if not items:
            lines.append("*Ninguno.*")
            continue
        for fi in items:
            lines.extend(
                [
                    f"- **{fi.route}** — `{fi.type}`: {fi.description}",
                    f"  - *Recomendación:* {fi.recommendation}",
                ]
            )
            if fi.element:
                lines.append(f"  - *Elemento:* {fi.element}")
            if fi.related_file:
                lines.append(f"  - *Archivo relacionado:* `{fi.related_file}`")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="ARGOS-IT local web audit")
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Origin del dev server (default: {DEFAULT_BASE_URL})",
    )
    parser.add_argument(
        "--no-fail-critical",
        action="store_true",
        help="Exit 0 aun si hay hallazgos criticos (solo para depuracion).",
    )
    args = parser.parse_args()

    base_url = args.base_url.strip().rstrip("/")
    if not base_url.startswith("http"):
        base_url = "http://" + base_url

    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    base_netloc = urlparse(base_url).netloc

    # Preflight
    try:
        r = session.get(base_url + "/", timeout=10)
        if r.status_code >= 500:
            sys.stderr.write(f"Servidor respondio {r.status_code} en preflight GET /\n")
    except requests.RequestException as e:
        sys.stderr.write(
            f"No se pudo conectar a {base_url}. Arranca el dev server (p. ej. npm run dev en frontend, puerto 3001).\n"
            f"Detalle: {e}\n"
        )
        return 2

    link_checker = LinkChecker(session, base_url, base_netloc)

    all_findings: list[Finding] = []
    pages: list[PageResult] = []

    for route in AUDIT_ROUTES:
        pr, f_list, _ = audit_route(route, base_url, session, link_checker)
        pages.append(pr)
        all_findings.extend(f_list)

    critical = sum(1 for x in all_findings if x.severity == "critical")
    medium = sum(1 for x in all_findings if x.severity == "medium")
    minor = sum(1 for x in all_findings if x.severity == "minor")

    gen_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    summary = {
        "generated_at": gen_at,
        "base_url": base_url,
        "pages_audited": len(AUDIT_ROUTES),
        "critical_count": critical,
        "medium_count": medium,
        "minor_count": minor,
    }

    payload = {
        "summary": summary,
        "limitations": (
            "Solo SSR/SSG sin ejecución JS; modales hidratadas y SPA pueden no estar en este HTML."
        ),
        "pages": [
        {
            "route": p.route,
            "url": p.url,
            "status_code": p.status_code,
            "elapsed_ms": round(p.elapsed_ms, 2) if p.elapsed_ms is not None else None,
            "html_bytes": p.html_bytes,
            "redirect_url": p.redirect_url,
            "script_tags": p.script_tags,
            "link_stylesheets": p.link_stylesheets,
        }
        for p in pages
        ],
        "findings": [f.to_dict() for f in all_findings],
    }

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    write_json(REPORTS_DIR / "audit-web.json", payload)
    write_markdown(REPORTS_DIR / "audit-web.md", summary, all_findings, pages)

    print(f"Informe JSON: {REPORTS_DIR / 'audit-web.json'}")
    print(f"Informe MD:   {REPORTS_DIR / 'audit-web.md'}")
    print(f"Resumen: criticos={critical} medios={medium} menores={minor}")

    if critical > 0 and not args.no_fail_critical:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
