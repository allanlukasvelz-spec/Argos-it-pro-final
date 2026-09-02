# ARGOS AI Security Model

## Threat model (public chat)

Untrusted client input may attempt:

- prompt injection / instruction override
- system prompt extraction
- secret extraction (API keys, JWT, DB)
- false business premises (Acronis, guarantees)
- abuse / cost exhaustion

## Controls

| Control | Mechanism |
|---------|-----------|
| Secrets | Server-only `OPENAI_API_KEY`; never in frontend |
| Injection | Deterministic pattern detection → refusal without provider call |
| Claims | Output claim scan + soft sanitize; knowledge blocked list |
| Actions | Allowlist only (`OPEN_DIAGNOSTIC`, `OPEN_CONTACT`, `NONE`) |
| Auth boundary | Public `/api/assistant` does not grant private `/api/client` or NOC |
| CSRF | Existing `csrfOriginGuard` on Express |
| Rate limit | Existing `aiLimiter` on mount |
| Payload | `express.json` 512KB; message max length env-capped |
| Context | In-memory session, TTL, max message window |
| Privacy | No analytics of message bodies; ephemeral store; warn users not to send credentials |
| Failure | 503 unavailable copy; no fake LLM replies when unconfigured |

## What is stored

| What | Why | Retention | Access |
|------|-----|-----------|--------|
| Recent turns in process memory | Context for follow-ups | TTL (~30m) or process restart | Backend process only |

No durable conversation surveillance by default.

## Residual risks

- Model may still paraphrase blocked claims; guards mitigate but are not perfect.
- In-memory store is per-process (multi-instance = no shared history).
- Production readiness requires configured key + operational monitoring.
