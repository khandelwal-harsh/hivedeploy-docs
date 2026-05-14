
import { Callout } from '../../components/Callout'

## Roles in the orchestrator

Every member of an org has one of three roles:

| Role | Can | Cannot |
|---|---|---|
| **Owner** | Everything below + delete org, transfer ownership, manage billing | — |
| **Admin** | Invite/remove members, connect cloud accounts, configure approvals, approve deployments, see all sessions | Manage billing, delete org |
| **Member** | Create deployments, run chat sessions, view their own runs | Connect cloud accounts, invite others, approve other people's deployments |

An org has **exactly one Owner** at any time. Transferring ownership
moves the role to another member; the old owner becomes Admin.

## Invite a teammate

`/settings → Members → Invite`.

1. Enter their email address
2. Pick their role (`member` is the default; pick `admin` if they
   need to connect clouds or approve deployments)
3. Click **Send invite**

The teammate receives an email with a sign-up link tied to your org.
They click the link, set a password, verify their email, and they're
in your org.

If they already have an orchestrator account on a different org,
clicking the invite link prompts them to switch to your org or hold
both. They can be in multiple orgs at once — useful for consultants
or shared engineering teams.

## Manage pending invites

`/settings → Members → Pending invites`.

For each pending invite you can:

- **Resend** the email (if they didn't receive it)
- **Copy link** (paste it into Slack/email manually if email's
  bouncing)
- **Cancel** the invite (revokes the signup link)

Invites expire in 7 days by default. After expiry, cancel and resend.

## Change someone's role

`/settings → Members → click their row → change role`.

Owners can change anyone's role. Admins can change Member ↔ Admin
but cannot demote Owner or promote anyone to Owner.

When demoting:

- Demoting an Admin to Member revokes their cloud-account-connect
  permission immediately. Cloud accounts they connected stay
  connected (owned by the org, not the user).
- Demoting an Owner is only possible by transferring ownership
  first.

## Remove a member

`/settings → Members → click their row → Remove`.

Effect:

- Their access to the org is revoked immediately
- Their **own deployments** stay (they're owned by the org, not the
  user)
- Sessions they participated in still show their messages with their
  email — for audit traceability
- They retain their orchestrator account; just no longer part of
  this org

If they want their data fully purged, they can delete their account
from `/settings → Account → Delete account`.

## Transfer ownership

Only the current Owner can do this. `/settings → Organization →
Transfer ownership`.

1. Pick a member from the list (must already be in your org)
2. Confirm by typing the org name
3. The new Owner is notified by email

After transfer:

- The new person has full Owner rights including billing
- You become Admin (or get removed entirely if you want)
- Org name, settings, and history are unchanged

Useful for handoffs: founding engineer leaves, hands ownership to
the CTO.

## Org-level settings

Owners + Admins see `/settings → Organization`:

- **Org name** — display name shown in the topbar
- **Org URL slug** — used in invite links (e.g.,
  `app.hivedeploy.in/join/acme`)
- **Default cloud account** — which cloud is auto-selected at Gate 3
  when a member starts a new deployment without an explicit choice
- **Approvals** — when deployments need a second approver (see
  [Approvals guide](/guides/approvals))
- **Audit log retention** — how long detailed audit events are kept
  (default 1 year on free; configurable on paid plans)

## See who's done what (audit log)

`/audit` shows every state-changing action in the org:

- Member invited / removed / role changed
- Cloud account connected / disconnected
- Deployment started / approved / applied / destroyed
- Sessions opened, plans changed, secrets rotated, etc.

Each entry shows: timestamp, actor, target, action, outcome (success
/ failure), payload (the relevant inputs / outputs). Filterable by
member, action type, date range.

This is the surface auditors care about for SOC 2 / GDPR / etc.
Owners + Admins see all org events; Members see only events they
were the actor on.

## Best practices

- **Keep Owner count = 1.** Multiple Owners is allowed but causes
  ambiguity for billing emails, recovery paths, and audits. One
  Owner; the others as Admins.
- **Use Admin sparingly.** Admin can connect clouds, which is a
  privileged action. Anyone with Admin can connect a malicious
  cloud account (deliberately or via stolen credentials). Keep
  the Admin list tight — typically 2-3 senior engineers.
- **Members for engineers; Admin for tech leads.** Members can
  deploy through clouds the org has already connected, which is
  what most engineers need.
- **Audit reviews monthly.** Skim the audit log for unfamiliar
  actors / unexpected actions, especially around cloud account
  connections.

## Limits per plan

Plan tiers cap the member count:

| Plan | Seats |
|---|---|
| Free | 2 |
| Team | 5 |
| Business | 25 |
| Enterprise | Unlimited |

When you hit the cap, invite buttons disable and the existing
members keep working. Upgrade your plan in `/settings → Billing`
(see [Billing guide](/guides/billing)).

## See also

- [Approvals workflow](/guides/approvals) — require a second approver
  for production deployments
- [Notifications](/guides/notifications) — control who gets notified
  about team activity
- [Billing & plans](/guides/billing) — seat limits and upgrades
