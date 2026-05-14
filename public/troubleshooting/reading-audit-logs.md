
Every state-changing action in the orchestrator emits an audit row. If something went wrong and you need to know **who** did **what**, **when**, and **why** it failed — this is where you look.

## Where the logs live

Audit rows are stored in Postgres in the `audit_events` table. Two ways to view them:

- **In-app:** Admins can browse the audit log at `/admin/audit` (filter by org, actor, action, time range).
- **Direct SQL:** Self-host operators can query Postgres directly. Useful for ad-hoc investigations and exporting to a SIEM.

## Schema

Every row has this shape (the JSON shown is the API's camelCase representation; the SQL column names are snake_case):

```json
{
  "id": "aud_01HXYZ…",
  "schemaVersion": "1.0",
  "occurredAt": "2026-05-13T14:23:45.123Z",
  "ingestedAt": "2026-05-13T14:23:45.456Z",
  "orgId": "org_abc123",

  "action": "cloud_account.connect",
  "outcome": "failure",
  "severity": "warning",

  "actor": {
    "type": "user",
    "id": "user_xyz",
    "email": "alice@example.com",
    "displayName": "Alice",
    "ip": "203.0.113.42",
    "userAgent": "Mozilla/5.0 …",
    "mfaUsed": true
  },

  "target": {
    "type": "cloud_account",
    "id": "ca_456",
    "name": "production-gcp",
    "parentIds": { "orgId": "org_abc123" }
  },

  "context": {
    "requestId": "req_789",
    "source": "ui",
    "traceId": "trace_…",
    "correlationId": "corr_…"
  },

  "changes": { "before": null, "after": { "provider": "gcp" }, "diffSummary": null },
  "error": { "code": "iam.api_not_enabled", "message": "iamcredentials.googleapis.com is not enabled on the customer project" },
  "integrity": { "prevHash": "…", "hash": "…", "batchId": "batch_…" }
}
```

### Top-level field reference

| Field | Type | Description |
|---|---|---|
| `id` | string | Stable audit ID (`aud_…`, ULID-derived) |
| `schemaVersion` | string | Schema version; currently `1.0` |
| `occurredAt` | ISO 8601 | When the action actually happened (UTC) |
| `ingestedAt` | ISO 8601 | When the audit row was persisted (UTC; usually within ms of `occurredAt`) |
| `orgId` | string | Tenant scope |
| `action` | string | Dotted action name (e.g., `cloud_account.connect`, `deployment.gate_advanced`, `org.member_role_changed`) |
| `outcome` | enum | One of: `success`, `failure`, `blocked`, `escalated`, `pending` |
| `severity` | enum | One of: `info`, `notice`, `warning`, `critical` |
| `actor` | object | Who did the action — see below |
| `target` | object | What was affected — see below |
| `context` | object | Request-time context (request id, trace, source channel) |
| `changes` | object \| null | `before`/`after` snapshots for mutating actions; null for reads |
| `error` | object \| null | Populated when `outcome != success` |
| `integrity` | object | Hash chain fields (tamper-evident logging) |

### Actor object

| Field | Type | Notes |
|---|---|---|
| `type` | enum | `user`, `service_account`, `api_key`, `agent`, or `system` |
| `id` | string \| null | Actor's stable id |
| `email`, `displayName` | string \| null | Denormalized for display |
| `ip` | string \| null | Client IP (single hop) |
| `userAgent` | string \| null | Browser/UA string |
| `apiKeyId` | string \| null | Set when `type == api_key` |
| `agentId` | string \| null | Set when `type == agent` |
| `mfaUsed` | bool | True if the action was MFA-verified |

### Target object

| Field | Type | Notes |
|---|---|---|
| `type` | string | Entity type — e.g., `cloud_account`, `deployment`, `org`, `org_member`, `session` |
| `id` | string \| null | Entity id |
| `name` | string \| null | Display name (denormalized) |
| `parentIds` | object | Lineage references (e.g., `{ "orgId": "org_…" }`) |

### Outcome semantics

| Outcome | Meaning |
|---|---|
| `success` | Action completed as intended |
| `failure` | Action failed (see `error.code` / `error.message`) |
| `blocked` | Action refused by policy (e.g., insufficient role, approval required) |
| `escalated` | Action required additional approval, deferred to another actor |
| `pending` | Action started but not yet resolved (e.g., long-running `terraform apply`) |

## Common queries

The examples below assume direct Postgres access. The `/admin/audit` UI exposes equivalent filters.

### "Why did my GCP connect fail?"

```sql
SELECT occurred_at, error->>'code' AS code, error->>'message' AS msg
FROM audit_events
WHERE org_id = 'org_abc123'
  AND action = 'cloud_account.connect'
  AND outcome = 'failure'
ORDER BY occurred_at DESC
LIMIT 10;
```

The `error.code` field is the specific failure mode (e.g., `iam.api_not_enabled`, `gcp.wif_principal_mismatch`). The `error.message` is human-readable detail. Map common codes to fixes via [Troubleshooting: Cloud 403 errors](/cloud-403).

### "Who approved this deployment?"

```sql
SELECT occurred_at, actor->>'email' AS approver
FROM audit_events
WHERE org_id = 'org_abc123'
  AND action = 'deployment.approval_decided'
  AND target->>'id' = 'dep_456'
  AND outcome = 'success';
```

### "What deployments did user X make today?"

```sql
SELECT occurred_at, target->>'name' AS deployment, action, outcome
FROM audit_events
WHERE org_id = 'org_abc123'
  AND actor->>'id' = 'user_xyz'
  AND action LIKE 'deployment.%'
  AND occurred_at >= now() - interval '24 hours'
ORDER BY occurred_at;
```

### "Show all blocked actions for compliance review"

```sql
SELECT occurred_at, action, actor->>'email', target->>'type', target->>'name',
       error->>'code' AS reason
FROM audit_events
WHERE org_id = 'org_abc123'
  AND outcome = 'blocked'
ORDER BY occurred_at DESC;
```

### "What changed on this cloud account?"

```sql
SELECT occurred_at, action,
       changes->'before' AS before,
       changes->'after' AS after,
       changes->>'diffSummary' AS summary
FROM audit_events
WHERE org_id = 'org_abc123'
  AND target->>'id' = 'ca_456'
  AND changes IS NOT NULL
ORDER BY occurred_at DESC;
```

## PII scrubbing

Audit `payload` and `changes` blobs are passed through a redaction layer before persistence. The following field shapes are scrubbed:

- Plaintext credentials (Service-account JSON keys, AWS access-key secrets, Azure client secrets)
- JWT tokens, API keys, refresh tokens
- Email bodies and message contents
- Password fields (hash or plaintext)
- Anything matching `*_secret`, `*_token`, `*_password`, `*_key` (case-insensitive) — value replaced with `"[REDACTED]"`

If you ever see a value that looks like it might be sensitive in a payload, **file a bug** — that's a defect in the scrubber.

## Integrity verification

The `integrity` block on each row carries:

- `prevHash` — hash of the previous row in this org's chain
- `hash` — hash of this row (over canonicalized JSON, excluding the hash itself)
- `batchId` — chronological batch identifier (rows are sealed in batches every minute)
- `signature` — optional KMS signature on the batch hash for tamper-evidence

To verify a row hasn't been tampered with:

1. Recompute the canonicalized JSON for the row (sorted keys, no whitespace).
2. SHA-256 it.
3. Compare against `integrity.hash`.

Any chain break indicates either a missing row (administrative deletion) or tampering.

## Retention

Audit rows are retained per the org's plan:

| Plan | Default retention |
|---|---|
| Free | 30 days |
| Starter | 90 days |
| Pro | 1 year |
| Enterprise | Configurable, 1–7 years |

Self-host operators control retention via the `AUDIT_RETENTION_DAYS` env var; see [Reference: Environment variables](/reference/env-vars).

## See also

- [Concepts: Security & WIF](/concepts/security-wif)
- [Reference: Webhooks & events](/reference/webhooks)
- [Troubleshooting: Cloud 403 errors](/cloud-403)
