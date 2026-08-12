# Visual regression baselines (FASE 21.1B)

Playwright stores **platform-specific** golden snapshots:

| Platform | Suffix | Used by |
|----------|--------|---------|
| macOS | `*-chromium-darwin.png` | Local dev on Mac |
| Linux | `*-chromium-linux.png` | GitHub Actions CI (`ubuntu-latest`) |

**CI official goldens:** Linux snapshots. Regenerate with:

```bash
docker compose -f docker-compose.visual-baseline.yml run --rm visual-baseline
```

Requires Docker. Uses `mcr.microsoft.com/playwright:v1.59.1-noble` + PostgreSQL 16 (same stack as CI).

**Policy:** `maxDiffPixels = 0` — do not increase tolerances. Regenerate goldens on the target platform when UI intentionally changes.

**Do not** rename `darwin` → `linux` or copy macOS PNGs as Linux goldens.
