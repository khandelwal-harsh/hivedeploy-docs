
import { Callout } from '../../components/Callout'

If you got an error message from the orchestrator, search this page
(`Cmd+F`) for any unique phrase from it.

---

## "API has not been used in project ..."

GCP API not enabled. See [Cloud 403 errors §1](/troubleshooting/cloud-403#1-required-api-not-enabled-most-common--gcp).

## "AccessDenied — User is not authorized to perform sts:AssumeRole"

AWS role trust policy wrong. See [Cloud 403 §3](/troubleshooting/cloud-403#3-iam-role-trust-policy-mismatch-aws).

## "AccessDenied — sts:ExternalId mismatch"

External ID in form doesn't match role's trust policy. See
[Cloud 403 §3](/troubleshooting/cloud-403#3-iam-role-trust-policy-mismatch-aws).

## "AADSTS7000215: Invalid client secret"

Azure client secret rotated/expired. Re-generate per
[Connect Azure Step 2](/connect-clouds/azure#step-2--generate-a-client-secret).

## "Couldn't load notifications"

Backend / network error on the notifications API. Click Retry. If
persists, check `https://status.hivedeploy.in`.

## "credential probe failed: ..."

The Connect button's probe failed. The full error text after the
colon tells you which step. See [Cloud 403 errors](/troubleshooting/cloud-403).

## "Email verification link expired"

Verification tokens are valid 24h. Click "Resend verification email"
on the login page.

## "Mark all read" disabled / not clickable

You have zero unread notifications. The button correctly disables.

## "No notifications match these filters"

The filter chip combination has no results. Click "Clear filters"
to see all notifications.

## "Org member limit reached — upgrade to invite more"

You hit the plan's seat cap. See [Billing](/guides/billing).

## "Please complete the security challenge"

Cloudflare Turnstile widget didn't load or you didn't tick the
checkbox. See the Turnstile-specific section in the platform admin
docs (internal).

## "Preparing your workspace…" stuck

Your JWT lacks an `org_id` claim; the orchestrator is fetching one.
Should resolve in 1-3 seconds. If stuck > 30 seconds, hard-reload
the page.

## "Probe failed: 403"

See [Cloud 403 errors](/troubleshooting/cloud-403).

## "Probe failed: Cloud Resource Manager API has not been used..."

See [Cloud 403 §1](/troubleshooting/cloud-403#1-required-api-not-enabled-most-common--gcp).

## "Service account ... exists but our principal lacks workloadIdentityUser"

WIF binding mismatch or required GCP API not enabled. See
[Cloud 403 §1](/troubleshooting/cloud-403#1-required-api-not-enabled-most-common--gcp)
and [§2](/troubleshooting/cloud-403#2-wif-binding-mismatch-gcp).

## "STRIPE_MOCK_MODE must NOT be true in production"

Self-hosted operator error: `STRIPE_MOCK_MODE=true` was set in a
production env. Set to `false` (or remove). See
[env-vars](/reference/env-vars#billing--payment-provider).

## "Tests are failing" (you're a developer trying to push)

This isn't a customer-facing error; it's a CI failure. Check the
build logs for the specific failing test.

## "Token expired — please log in again"

Your auth JWT expired (12h TTL). Log in again. The orchestrator
doesn't auto-extend — if you want longer sessions, contact support.

## "WIF binding scoped to a different principal"

Your binding's `attribute.org_id/X` doesn't match the orchestrator's
JWT. See [Cloud 403 §2](/troubleshooting/cloud-403#2-wif-binding-mismatch-gcp).

## "WIF provider doesn't trust this orchestrator's issuer"

Your provider's `--issuer-uri` doesn't match the orchestrator's
actual issuer URL (`https://backend.hivedeploy.in`). Delete and
recreate the OIDC provider with the correct issuer URI per
[Connect GCP](/connect-clouds/gcp).

## "You're all caught up"

Not an error — you have zero notifications.

---

## How to file a bug

If your error isn't in this list, file at
`support@hivedeploy.in` with:

- Exact error message
- Steps to reproduce
- Your org ID (from the GCP connect form's banner or DevTools)
- Timestamp (so we can find the matching audit log entry)

We add new entries to this list as customers hit them.

## See also

- [Cloud connect 403 errors](/troubleshooting/cloud-403)
- [Deployment stuck](/troubleshooting/deployment-stuck)
- [Concepts — Architecture](/concepts/architecture) — useful
  for understanding what subsystem your error comes from
