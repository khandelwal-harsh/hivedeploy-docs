
import { Callout } from '../../components/Callout'

## Common causes by gate

### Stuck at Gate 1-4 (pre-plan gates)

These gates are conversational — the session waits for **your**
input. If it seems stuck:

- Check that you actually submitted a message (not just typed and
  left it in the input)
- The agent's last message may be a clarifying question; scroll up
  to find what it asked
- Reload the page if the SSE stream got interrupted

If the agent's last message is mid-token (cut off), it likely hit a
network error or LLM rate limit. Send `continue` to nudge it.

### Stuck at Gate 5 (review) — pending approval

If your org has approvals required, Gate 5 waits for an Admin to
approve. Signs:

- Yellow "Waiting for approval" banner at the top of the session
- No assistant message after your last "looks good"

Action: ping your org's admins in Slack / email. They get
notifications, but if they're offline you might need to escalate.

If you ARE an admin and your own deployment is stuck — you can't
self-approve. Need a different admin to click Approve.

See [Approvals workflow](/guides/approvals).

### Stuck at Gate 6 (deploy) — terraform apply running

Some deployments take a while. Reference times:

| Deployment | Typical apply time |
|---|---|
| Postgres (Cloud SQL / RDS) | 4-8 minutes |
| EKS / GKE cluster | 10-25 minutes |
| Kafka cluster | 8-15 minutes |
| Static frontend | 1-3 minutes |
| Python service (Cloud Run / Lambda) | 2-5 minutes |

If a deploy has been running > 2x the typical time, something's
likely wrong. Check the session's output log — Terraform usually
prints what it's doing every ~30s.

### Stuck at Gate 6 — apparent freeze, no log updates

The Celery worker running terraform may have died. Symptoms:

- Last log line is several minutes old
- No `tick: <resource>: Still creating...` lines from Terraform

Action: Try refreshing the page. If the session genuinely got
orphaned (rare; worker crash), contact support — we can manually
resync.

## "Agent isn't responding"

Symptom: you send a message, the assistant icon shows "Thinking..."
indefinitely.

Causes:

- **LLM rate limit.** The LLM provider applies per-org rate limits.
  The orchestrator queues; usually clears in under 30s. Wait.
- **Network error mid-stream.** Refresh the page — the message is
  persisted, you can re-send.
- **Backend down.** Check `https://status.hivedeploy.in` (if we
  have a status page) or contact support.

## "I changed my mind — how do I go back a gate?"

Type `go back` or `revise gate N`. The agent responds with the
re-opened gate's question.

Caveats:
- Going back from Gate 6 is possible only if apply hasn't started
  yet. After apply runs, undoing requires `destroy`.
- Going back wipes downstream choices — if you re-pick a cloud at
  Gate 3, the sizing chosen at Gate 4 is reset.

## "Apply finished but I can't see the resource in my cloud"

The orchestrator's deployment record points at specific resource
identifiers. To find them:

1. `/deployments → click the deployment`
2. Look at the "Resources created" section
3. Each resource has a cloud-console deep link (e.g., "Open in GCP
   Console")

If the resource is in a different cloud account from what you
expected, check Gate 3 of the session — possibly you picked the
wrong cloud account.

## "Deployment failed with a Terraform error"

The session shows the full Terraform error in the chat. Common ones:

| Terraform error | Likely cause |
|---|---|
| `Error: project not found` | Wrong project ID at Gate 3, or cloud-account row points at wrong project |
| `Error: quota exceeded` | Cloud account's quota for that resource is too low; request quota increase from your cloud |
| `Error: name already in use` | A resource with the chosen name exists; pick a different name at Gate 2 |
| `Error: permission denied` | The orchestrator's federated SA lacks the IAM role for this action; add the role |
| `Error: invalid region` | Region doesn't support this service; pick another region |

The agent usually proposes a fix in its next message. If not, ask:
"why did this fail and how do I fix it?"

## "Resources created but the agent says 'failed'"

Sometimes Terraform partially completes — some resources land, then
a later one fails. The session shows `Apply complete with errors`
and lists what got created.

Action options:

- **Roll back** — `roll back this deployment` → agent runs
  destroy on the partially-created resources
- **Retry the apply** — `retry apply` → agent runs terraform with
  the existing state (will skip already-created resources and try
  the failed ones)
- **Manual recovery** — if a resource ended up in a weird state,
  fix it in the cloud console, then `mark as done`

## "I want to start over"

`/deployments → click the deployment → Destroy`. Then start a fresh
session.

If you can't destroy because the deployment never completed Gate 6
(no resources exist):

```
DELETE /api/deployments/:id
```

Or contact support for help with orphan rows.

## See also

- [Concepts — Gates](/concepts/gates) — the gate flow
- [Approvals workflow](/guides/approvals) — for Gate 5 stuck-on-approval
- [Common errors](/troubleshooting/common-errors) — error message → fix mapping
