
import { Callout } from '../../components/Callout'

When you click **Connect** on a cloud-account form and get a 403,
the orchestrator's probe couldn't authenticate or authorize against
your cloud. This page lists the common causes by symptom.

## Decision tree

```
Got "credential probe failed" with status 403?
  │
  ├─ Is the error text "API not enabled" or contains
  │  "has not been used in project"?
  │   └─ → Enable required APIs (see #1 below)
  │
  ├─ Does the error mention "workloadIdentityUser" / "ExternalId"
  │  / "AADSTS"?
  │   └─ → IAM binding mismatch (see #2 for GCP, #3 for AWS, #4 for Azure)
  │
  ├─ Does the error mention "service account disabled" /
  │  "user disabled" / "app disabled"?
  │   └─ → Re-enable the identity (see #5)
  │
  └─ Other: → check the full GCP / AWS / Azure response body in the
       UI's error message
```

## 1. Required API not enabled (most common — GCP)

**Symptom:**
```
credential probe failed: Required GCP API not enabled on the
customer project. Run: gcloud services enable
iamcredentials.googleapis.com cloudresourcemanager.googleapis.com
sts.googleapis.com --project=<your-project-id>
```

Or older error before adapter improvements:
```
credential probe failed: ... API has not been used in project
973739627872 before or it is disabled
```

**Cause:** GCP requires explicit per-project enablement of three
APIs for the WIF + impersonation flow. New projects have them
disabled by default.

**Fix:**

```bash
gcloud services enable \
  sts.googleapis.com \
  iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project=YOUR_PROJECT_ID
```

While you're at it, enable the APIs your deployments will hit
(compute, container, storage, etc.) per the
[GCP connect guide Step 0](/connect-clouds/gcp#step-0--enable-required-gcp-apis).

Wait ~30s for the enable to propagate, then retry Connect.

## 2. WIF binding mismatch (GCP)

**Symptom:**
```
credential probe failed: Service account orch-deployer@... exists
but our principal lacks workloadIdentityUser
```

**Cause (most common):** The `attribute.org_id/<value>` in your IAM
binding doesn't match the `org_id` claim in the orchestrator's JWT.

**Diagnose:**

```bash
# What does GCP think the binding requires?
gcloud iam service-accounts get-iam-policy \
  orch-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Look for `attribute.org_id/X` in the principalSet.

```js
// In orchestrator UI's DevTools console:
JSON.parse(atob(localStorage.getItem('auth_token').split('.')[1])).org_id
```

`X` and the printed value must match exactly. If they don't:

```bash
# Replace YOUR_ORG_ID with the value DevTools printed
PROJECT_NUM=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

gcloud iam service-accounts add-iam-policy-binding \
  orch-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUM/locations/global/workloadIdentityPools/orch-pool/attribute.org_id/YOUR_ORG_ID"
```

**Cause (other):** The WIF provider's attribute mapping is missing
`attribute.org_id`. Verify:

```bash
gcloud iam workload-identity-pools providers describe orch-provider \
  --location=global --workload-identity-pool=orch-pool \
  --format=json | jq '.attributeMapping'
```

Must include `"attribute.org_id": "assertion.org_id"`. If missing,
update:

```bash
gcloud iam workload-identity-pools providers update-oidc orch-provider \
  --location=global \
  --workload-identity-pool=orch-pool \
  --attribute-mapping="google.subject=assertion.sub,attribute.org_id=assertion.org_id,attribute.cloud_account_id=assertion.cloud_account_id,attribute.environment=assertion.environment"
```

## 3. IAM role trust policy mismatch (AWS)

**Symptom:**
```
credential probe failed: AccessDenied — User is not authorized to
perform sts:AssumeRole on resource: arn:aws:iam::987...:role/...
```

or

```
credential probe failed: AccessDenied — sts:ExternalId mismatch
```

**Causes:**

1. The orchestrator's IAM principal ARN in your role's trust policy
   doesn't match what the orchestrator sends. Verify by re-checking
   the "Orchestrator IAM principal" field in the connect form and
   updating your role's trust policy if mismatched.

2. The external ID in the form doesn't match what's in your role's
   trust policy `Condition.StringEquals.sts:ExternalId`. The
   external ID is **org-specific and immutable** — re-create the
   role's trust policy with the value the form shows.

**Fix:**

```bash
# Update trust policy
cat > trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "PASTE_ORCHESTRATOR_PRINCIPAL_FROM_FORM"},
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {"sts:ExternalId": "PASTE_EXTERNAL_ID_FROM_FORM"}
    }
  }]
}
EOF

aws iam update-assume-role-policy \
  --role-name OrchestratorDeployer \
  --policy-document file://trust-policy.json
```

Retry Connect.

## 4. App registration / Service Principal misconfigured (Azure)

**Symptom:**
```
credential probe failed: AADSTS7000215: Invalid client secret
```

or

```
credential probe failed: AADSTS50034: The user account does not
exist in the tenant
```

**Causes:**

1. **Client secret expired or rotated.** Azure secrets expire (max
   2 years). Generate a new one and update the orchestrator form.

2. **Wrong Tenant ID or Client ID** typed into the form. Verify
   with:
   ```bash
   az account show --query "{tenantId:tenantId, subscriptionId:id}"
   az ad app show --id YOUR_APP_ID --query "{appId:appId, displayName:displayName}"
   ```

3. **Service Principal not granted any role** on the subscription /
   resource group:
   ```bash
   az role assignment list --assignee YOUR_APP_ID --all
   ```
   If empty, grant per [Connect Azure Step 3](/connect-clouds/azure#step-3--grant-the-service-principal-a-role-on-your-subscription).

## 5. Identity disabled

**Symptom (varies):**
```
GCP: "The service account orch-deployer@... is disabled"
AWS: "Access denied — role is disabled"
Azure: "AADSTS7000222: Application is disabled"
```

**Cause:** Someone disabled the identity in your cloud's console.
GCP and Azure allow disabling SAs / apps without deleting them.

**Fix:**

```bash
# GCP
gcloud iam service-accounts enable orch-deployer@YOUR_PROJECT.iam.gserviceaccount.com

# Azure
az ad app update --id YOUR_APP_ID --set accountEnabled=true
```

(AWS doesn't have a per-role disable; only delete.)

## 6. Cloud project / subscription suspended

**Symptom:**
```
credential probe failed: ... project is suspended
credential probe failed: ... subscription is disabled
```

**Cause:** Billing issue on your cloud account, or admin action.

**Fix:** Resolve the underlying issue in your cloud console (often
billing). The orchestrator can't fix this for you.

## 7. Cross-region issues

**Symptom:** Probe succeeds but deployments fail with region-specific
errors.

**Cause:** Some cloud services aren't available in all regions
(e.g., some AWS regions don't have all services, some Azure regions
require special opt-in).

**Fix:** Check the cloud's service-availability matrix for your
chosen region. If the service you're deploying isn't available
there, pick a different region at Gate 3.

## 8. Stale credentials in orchestrator cache

**Symptom:** Connect worked an hour ago; now intermittent 403s.

**Cause:** The orchestrator caches federated tokens in Redis for
~55min. If your cloud-side identity changed (e.g., you rotated the
client secret, or the SA got disabled-then-re-enabled), the cache
still has the stale token.

**Fix:** Disconnect and reconnect the cloud account. This forces a
fresh probe + cache invalidation.

Or wait ~55 min for the cache to expire naturally.

## When to contact support

If none of the above match your error, contact support at
`support@hivedeploy.in` with:

- Your org ID (from DevTools or the connect form's banner)
- The cloud provider (AWS / GCP / Azure)
- The exact error message from the orchestrator UI
- The relevant cloud-console screenshot (e.g., the SA's IAM policy
  on GCP, the role's trust policy on AWS, the App registration on
  Azure)

We can also check our own audit logs for the relevant `oidc.token_minted`
event matching your attempt and pinpoint what got rejected.

## See also

- [Connect GCP](/connect-clouds/gcp) — full GCP setup
- [Connect AWS](/connect-clouds/aws) — full AWS setup
- [Connect Azure](/connect-clouds/azure) — full Azure setup
- [Concepts — Security model](/concepts/security-wif) — why
  the trust setup is the way it is
