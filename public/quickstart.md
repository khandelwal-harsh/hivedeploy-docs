
import { Callout } from '../components/Callout'

Sign up to deploying a real Postgres database to your cloud account in
about 10 minutes. After this you'll understand the four core nouns of
the platform: **org**, **cloud account**, **agent**, **deployment**.

## What you'll build

A managed Postgres 16 instance, provisioned by the **Postgres
specialist agent**, running on your own GCP / AWS / Azure account.
The orchestrator handles Terraform, networking, backups, and
monitoring config. You answer ~5 questions in chat; the agent does
the rest.

## Prerequisites

- A GCP / AWS / Azure cloud account with billing enabled and
  permissions to create IAM resources
- 10 minutes
- (Optional) `gcloud` / `aws` / `az` CLI installed for the cloud
  connect step

## Step 1 — Sign up

Go to [app.hivedeploy.in](https://app.hivedeploy.in/signup) and create
an account with your work email. You'll receive a verification email;
click the link.

> If the verification email doesn't arrive in 30 seconds, check spam.
> The sender is `no-reply@hivedeploy.in`.

When you log in for the first time:

- Your **org** is created automatically. The default name is your
  email username; rename it in `/settings → Organization`.
- You're added as the **owner** of the org. Owners can invite
  teammates, manage billing, and connect cloud accounts.

## Step 2 — Connect your cloud account

Navigate to **Cloud Accounts → Connect cloud** and pick your provider:

- **GCP** — uses Workload Identity Federation (no credential files
  stored). See [Connect GCP](/connect-clouds/gcp) for the full setup.
- **AWS** — uses cross-account IAM role (no access keys stored). See
  [Connect AWS](/connect-clouds/aws).
- **Azure** — uses service principal. See
  [Connect Azure](/connect-clouds/azure).

The connect flow takes 5-10 minutes the first time (you create a few
IAM resources in your cloud). Subsequent cloud accounts take ~1 minute.

> **Note:** the orchestrator never holds long-lived
credentials for your cloud account. All access is via short-lived
federated tokens, scoped to your specific org. See the
[security model](/concepts/security-wif) for details.

After connect succeeds, you'll see a green "Connected" badge.

## Step 3 — Start a Postgres deployment

Navigate to **Agents → Postgres**. You'll see the Postgres specialist's
landing page. Click **Start a deployment**.

The chat opens. The agent introduces itself and asks the first
question (Gate 1):

> *"What's the high-level intent for this Postgres? Examples: 'main
> app database', 'analytics warehouse', 'session cache'. One line."*

Answer: `Main app database for a Python web service`.

The agent advances to **Gate 2 (scope)** and confirms:

> *"Got it. Provisioning a primary instance with daily backups, point-
> in-time recovery, and read-replica-ready config. Sound right?"*

Type `yes` (or refine the scope).

## Step 4 — Pick a region (Gate 3)

The agent asks where to deploy:

> *"Which region? You've connected GCP `your-project-id`. Options:
> us-central1 (Iowa, recommended), us-east1, europe-west1.
> Or paste your own region ID."*

Pick the region closest to your customers, or just say `us-central1`
for the default. (Background: which clouds you've connected determines
the default options; you can always override.)

## Step 5 — Sizing (Gate 4)

The agent proposes resource sizing based on your scope:

> *"For 'main app database' I'd default to:*
>
> *- `db-custom-2-7680` (2 vCPU, 7.5 GB RAM) — handles ~5k QPS*
> *- 100 GB SSD storage*
> *- Estimated GCP cost: **$185/month**.*
>
> *Acceptable? Or change vCPU / RAM / disk?"*

Type `looks good` or adjust. Cost estimates pull from current GCP
pricing.

## Step 6 — Review (Gate 5) + Deploy (Gate 6)

The agent shows a Terraform plan summary:

> *"I'll create:*
> *- `google_sql_database_instance.postgres_main`*
> *- `google_compute_network.postgres_vpc`*
> *- `google_compute_subnetwork.postgres_private`*
> *- VPC peering for private IP*
> *- IAM bindings: roles/cloudsql.client to your app SA*
>
> *Ready to apply? (yes / show plan / cancel)"*

Type `yes`. The agent runs `terraform apply` server-side using your
WIF-federated GCP credentials (the orchestrator holds no creds; it
impersonates the SA you set up in Step 2). Resources land in your
project in ~3-5 minutes.

When done, the agent shows:

```
✓ Deployed
  - Connection: postgres://hivedeploy:****@10.20.0.3:5432/main
  - Cloud SQL instance: my-project:us-central1:postgres-main
  - Backup window: 03:00 UTC, retained 7d
```

## What just happened

In 10 minutes, you:

- Signed up + verified email
- Connected a cloud account via federated trust (no creds stored)
- Talked to the **Postgres specialist agent** which walked you through
  6 gates (intent → scope → infra target → sizing → plan → apply)
- The agent generated production-grade Terraform, executed it against
  your cloud, and surfaced connection details

The agent's specialty isn't writing Terraform — it's knowing **what
Postgres-specific decisions to make** at each gate (which extension
set, which backup strategy, which IAM model, which connection pooler,
which monitoring config) so a generic IaC tool can apply them.

## Next steps

- **Deploy more services.** Browse `/agents` for the full list (~140
  specialists across languages, databases, ML, observability, etc.).
- **Invite teammates.** `/settings → Members`. Set roles (owner /
  admin / member). [Team management guide](/guides/team-management).
- **Require approvals for prod.** If your org has multiple engineers,
  configure [approvals](/guides/approvals) so risky changes need
  a second approver.
- **Understand the gate system better.** Read [Concepts — Gates](/concepts/gates).

## Cleaning up

To delete this Postgres:

1. Navigate to **Deployments → postgres-main**
2. Click **Destroy** → confirm
3. The orchestrator runs `terraform destroy` against your project
4. Resources are gone within ~2 minutes

The cloud account itself stays connected for future deployments.
