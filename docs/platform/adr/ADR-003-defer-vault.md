# ADR-003: Defer Vault; improve env + agent secret hygiene first

## CONTEXT

Secrets today: JWT pair, DATABASE_URL, optional OpenAI, hashed agent credentials. HashiCorp Vault is powerful but operationally heavy (unseal/HA/DR) for current scale.

## DECISION

DEFER Vault. Document rotation/redaction. Revisit when secret sprawl or compliance requires dynamic secrets.

## ALTERNATIVES

- Vault OSS now — rejected (ops burden)
- Cloud secrets manager — optional later if hosting dictates

## WHY

Official Vault guidance: overwhelming for simple needs; HCP/self-host adds critical dependency.

## SECURITY

Continue fail-closed auth; never log credentials; keep agent plaintext one-time.

## ROLLBACK

N/A.

## STATUS

ACCEPTED
