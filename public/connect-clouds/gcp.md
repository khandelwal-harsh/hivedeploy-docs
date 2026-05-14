
import { Callout } from '../../components/Callout'

Connects a customer's Google Cloud project to the AI Orchestrator using
**Workload Identity Federation (WIF)** — the modern, keyless integration
pattern used by GitHub Actions, CircleCI, Terraform Cloud, and other
SaaS platforms that orchestrate customer infrastructure.

After connecting:
- The orchestrator can deploy resources to your GCP project
- **No GCP credentials ever leave your project** — there's no service
  account JSON key file to manage or rotate
- Trust is scoped to your specific org in the orchestrator via
  `attribute.org_id` binding; other customers cannot impersonate your
  service account even if they use the same orchestrator instance

## Prerequisites

- A GCP project (active, with billing enabled if you'll deploy
  billable resources)
- `gcloud` CLI installed and authenticated to that project
- A few minutes — the whole setup is ~5-10 minutes for the first
  project; subsequent projects are similar

## Step-by-step setup

### Step 0 — Enable required GCP APIs

The most common cause of "Connect failed with 403" is missing API
enablement on the customer project. Run this once per project:

```bash
gcloud services enable \
  sts.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  storage.googleapis.com \
  --project=YOUR_PROJECT_ID
```

The first three (`sts`, `iamcredentials`, `cloudresourcemanager`) are
required for WIF authentication itself. The rest are needed by the
deployment specialists that will create resources in your project
(extend the list based on what services you'll deploy — e.g. add
`sqladmin.googleapis.com` if deploying Cloud SQL, `cloudkms.googleapis.com`
if deploying with KMS-protected resources).

### Step 1 — Create a Workload Identity Pool

```bash
gcloud iam workload-identity-pools create orch-pool \
  --location=global \
  --display-name="AI Orchestrator Pool"
```

Pools are containers for federated identities. One pool per project is
typical.

### Step 2 — Create an OIDC provider trusting the orchestrator

The provider tells GCP which external identity provider (the
orchestrator's OIDC issuer) to trust, and how to map JWT claims to
GCP attributes:

```bash
gcloud iam workload-identity-pools providers create-oidc orch-provider \
  --location=global \
  --workload-identity-pool=orch-pool \
  --issuer-uri="https://backend.hivedeploy.in" \
  --attribute-mapping="google.subject=assertion.sub,attribute.org_id=assertion.org_id,attribute.cloud_account_id=assertion.cloud_account_id,attribute.environment=assertion.environment"
```

> **Warning:** the `--attribute-mapping` value must be one continuous line. Shell soft-wrap or pasting from a document that auto-wraps long lines introduces invisible newlines/spaces that gcloud rejects with a confusing parser error. If you hit that, assign to a variable first and `echo "$ATTR_MAPPING"` to verify no spaces or newlines before passing it with `--attribute-mapping="$ATTR_MAPPING"`.

After creation, get the provider's full resource path:

```bash
gcloud iam workload-identity-pools providers describe orch-provider \
  --location=global \
  --workload-identity-pool=orch-pool \
  --format="value(name)"
```

Output looks like:
```
projects/123456789012/locations/global/workloadIdentityPools/orch-pool/providers/orch-provider
```

You'll paste this into the orchestrator's connect form.

### Step 3 — Create a service account with deployment permissions

```bash
gcloud iam service-accounts create orch-deployer \
  --display-name="AI Orchestrator Deployer"
```

Grant the SA whatever roles your deployments need. Start narrow — you
can always add more later:

```bash
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="orch-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Add roles based on what you'll deploy. These are common starting
# points; trim/expand to fit your actual deployment workloads.
for role in \
  roles/container.clusterAdmin \
  roles/compute.networkAdmin \
  roles/storage.admin \
  roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role"
done
```

### Step 4 — Grant the orchestrator permission to impersonate this SA

This is the trust grant — it allows JWTs minted by the orchestrator
(with `org_id` matching your orchestrator org) to impersonate this SA.

First find your **orchestrator Org ID** — visible at the top of the
GCP connect form in the orchestrator UI, labeled "Your orchestrator
Org ID". It looks like `o-f6bb2d865d8c`.

Then:

```bash
PROJECT_NUM=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
YOUR_ORG_ID=o-f6bb2d865d8c   # from the orchestrator UI

gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUM/locations/global/workloadIdentityPools/orch-pool/attribute.org_id/$YOUR_ORG_ID"
```

> **Note:** This binding is scoped to your specific org_id
in the orchestrator. Other orgs using the same orchestrator instance
cannot impersonate this SA. Their JWTs carry a different `org_id`
claim, which doesn't match this binding, so GCP STS rejects them.

### Step 5 — Connect via the orchestrator UI

Navigate to `Cloud Accounts → Connect cloud → GCP` and paste:

| Field | Value |
|---|---|
| **Account label** | Free-text, e.g. `prod-gcp` |
| **GCP project ID** | Your project ID (e.g. `your-project-abc123`) |
| **Workload identity provider** | The full path from Step 2 (`projects/NNN/locations/.../providers/orch-provider`) |
| **Service account email** | The SA email from Step 3 (`orch-deployer@your-project-abc123.iam.gserviceaccount.com`) |
| **Default region** | The GCP region your deployments target (e.g. `us-central1`) |

Click **Connect**. The orchestrator runs a smoke test:
1. Mints a JWT with `org_id` claim matching your orchestrator org
2. Exchanges it via `sts.googleapis.com` for a federated token
3. Impersonates the SA via `iamcredentials.googleapis.com`
4. Reads project metadata as the final check

On success: green "Connected" badge.

## Troubleshooting

### "403 — Service account exists but our principal lacks workloadIdentityUser"

Most common: **Step 0 API enablement was skipped**. Verify with:

```bash
gcloud services list --enabled \
  --filter="name:iamcredentials.googleapis.com" \
  --project=YOUR_PROJECT_ID
```

If empty → enable per Step 0.

If APIs are enabled, the next most common cause is that the
`workloadIdentityUser` binding (Step 4) doesn't match your
orchestrator's `org_id`. Verify the binding contains your actual
org_id (no placeholder like `<YOUR_ORG_ID>`):

```bash
gcloud iam service-accounts get-iam-policy "$SA_EMAIL"
```

Should show:
```yaml
- members:
  - principalSet://iam.googleapis.com/projects/.../attribute.org_id/o-f6bb2d865d8c   # ← real ID
  role: roles/iam.workloadIdentityUser
```

If the value after `attribute.org_id/` is a placeholder or wrong ID,
re-run Step 4 with the correct value.

### "WIF provider doesn't trust this orchestrator's issuer"

The OIDC provider's `--issuer-uri` (set in Step 2) doesn't match the
orchestrator's actual issuer URL. Verify both:

```bash
gcloud iam workload-identity-pools providers describe orch-provider \
  --location=global --workload-identity-pool=orch-pool \
  --format="value(oidc.issuerUri)"
```

Should print `https://backend.hivedeploy.in` (exactly — no trailing
slash, no path differences). If it shows a different URL, the
provider was created against the wrong issuer. Delete and recreate
the provider with the correct `--issuer-uri`.

### "WIF binding scoped to a different principal"

The federated JWT had a valid signature, but the principal it
represents doesn't match any binding on the SA. Same root cause as
the workloadIdentityUser error above — fix per that section.

### Probe succeeds but deployments fail with 403 on Compute / Storage / Container

The SA can be impersonated, but it lacks the role to do whatever the
deployment is attempting. Either:

1. Grant the missing role (Step 3 lists starting roles; add more as
   needed based on the failure)
2. Enable the missing API (`gcloud services enable compute.googleapis.com`
   etc. per Step 0 — extend the list)

The error response body usually names the specific permission missing
(e.g. `compute.instances.create`); search GCP docs for which role
includes it.

## Removing a GCP connection

```bash
# 1. Delete the binding from the SA (revokes orchestrator's impersonation)
gcloud iam service-accounts remove-iam-policy-binding "$SA_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUM/locations/global/workloadIdentityPools/orch-pool/attribute.org_id/$YOUR_ORG_ID"

# 2. Remove the cloud-account row from the orchestrator UI
# (Cloud Accounts → click the account → Remove)
```

Optional cleanup (if no other orchestrator integration uses these):

```bash
gcloud iam workload-identity-pools providers delete orch-provider \
  --location=global --workload-identity-pool=orch-pool
gcloud iam workload-identity-pools delete orch-pool --location=global
gcloud iam service-accounts delete "$SA_EMAIL"
```

## How this works under the hood

Every time the orchestrator needs to act on your GCP project:

1. The orchestrator mints a short-lived (5-minute) JWT with claims:
   - `iss`: `https://backend.hivedeploy.in` (orchestrator's OIDC issuer)
   - `aud`: full WIF provider resource URL
   - `sub`: `org:<your-org-id>`
   - `org_id`: `<your-org-id>` (this is what `attribute.org_id` maps from)
   - plus context like `cloud_account_id`, `deployment_id`, `agent_id`

2. The JWT is signed with an RSA key whose public part is published
   at `https://backend.hivedeploy.in/.well-known/jwks.json` (your
   GCP WIF provider fetches and caches this).

3. The orchestrator exchanges the JWT at `sts.googleapis.com/v1/token`
   for a federated access token. GCP STS validates the JWT signature,
   matches the audience to your provider, and projects claims into
   `attribute.*` per your mapping.

4. The orchestrator uses the federated token to call
   `iamcredentials.googleapis.com:generateAccessToken` on your SA. GCP
   IAM checks if the federated principal has `workloadIdentityUser` —
   it does (Step 4 binding), scoped to your specific `org_id`.

5. The resulting GCP access token is cached in the orchestrator's
   Redis for ~55 minutes and used for actual GCP API calls during
   deployments.

The orchestrator holds **no long-lived GCP credentials** in this design.
Compromise of the orchestrator's RSA signing key (production: stored
in GCP KMS HSM) is the only way to impersonate any customer SA — and
even then, only customers who set up the trust binding are at risk.

## See also

- [Connect AWS](/connect-clouds/aws)
- [Connect Azure](/connect-clouds/azure)
- [Concepts — Security model](/concepts/security-wif) (per-org isolation deep dive)
