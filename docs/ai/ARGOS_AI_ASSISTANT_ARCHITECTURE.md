# ARGOS AI Assistant Architecture

**Mission:** AI CONVERSATIONAL ASSISTANT 13
**Status:** Implemented (code) — production provider gate separate

## Overview

```
Browser (Quiet Authority UI)
  → Next.js Route Handler POST /api/assistant/chat
  → Express POST /api/assistant/chat (aiLimiter + CSRF origin guard)
  → assistantService (validation, guards, bounded history)
  → AIProvider.generateResponse()
  → OpenAI adapter (when OPENAI_API_KEY configured)
  → Verified ARGOS knowledge embedded in server-side system prompt
```

Provider credentials never leave the backend. The browser never receives the system prompt.

## Components

| Layer | Path |
|-------|------|
| Provider abstraction | `backend/lib/ai/provider.js` |
| OpenAI adapter | `backend/lib/ai/openaiProvider.js` |
| Knowledge | `backend/lib/ai/argosKnowledge.js` |
| System prompt | `backend/lib/ai/systemPrompt.js` |
| Guards / actions | `backend/lib/ai/guards.js` |
| Conversation store | `backend/lib/ai/conversationStore.js` |
| Orchestration | `backend/lib/ai/assistantService.js` |
| HTTP | `backend/routes/assistant.js` |
| Frontend proxy | `frontend/app/api/assistant/chat/route.ts` |
| UI | `frontend/components/assistant/*` |

## Existing surfaces preserved

- Mascot dock chat (`/api/ai/public/mascot-chat`) remains for Dumbo/Chico personas.
- Hero CTA **Iniciar diagnóstico ARGOS** unchanged.
- New entry: **Hablar con ARGOS** (launcher, left/fixed).

## Configuration

See `backend/.env.example`:

- `AI_PROVIDER` — `openai` | `none` (default: openai if key present)
- `AI_MODEL` / `OPENAI_MODEL`
- `OPENAI_API_KEY` — server only
- `AI_MESSAGE_MAX_LEN`, `AI_MAX_OUTPUT_TOKENS`, conversation TTL/max messages

## Actions (allowlist)

Model may append `[[ARGOS_ACTION:…]]`. Application accepts only:

- `OPEN_DIAGNOSTIC`
- `OPEN_CONTACT`
- `NONE`

UI decides whether to surface CTAs; no arbitrary URL/command execution.
