
import { Callout } from '../../components/Callout'

The orchestrator has three tiers plus Enterprise. Each tier has
fixed limits on seats, active agents, and monthly LLM credits.

> **Note:** (May 2026): the platform is mid-migration from Stripe to
an alternative payment provider. The in-app billing surface is
behind a feature flag (`PAYMENT_PROVIDER=none` while we migrate).
Plans are real and tracked; checkout / upgrade is currently
handled via support email — automation returns when migration
completes.

## Plans at a glance

| Plan | Seats | Active agents | Monthly credits | Price |
|---|---|---|---|---|
| **Free** | 2 | 1 | $5 in LLM credits | $0 |
| **Team** | 5 | 3 | $70 in LLM credits | $99 / mo |
| **Business** | 25 | 15 | $560 in LLM credits | $499 / mo |
| **Enterprise** | Unlimited | Unlimited | Custom | Contact sales |

Annual billing offered for Team and Business with ~17% discount.

## What "active agents" means

An **active agent** is an agent that has at least one **active
deployment** managed by it. If you've deployed two Postgres
instances and one Redis, that's **2 active agents** (Postgres,
Redis) regardless of how many resources.

Agents become "active" at Gate 6 (deploy) and become "inactive" when
all of their deployments are destroyed. Active-agent count is the
basis for the cap-per-plan limit.

## What "credits" means

Every agent message that calls the LLM consumes credits at the
underlying provider's rate (input + output tokens × published pricing).
Each plan includes a monthly LLM credit budget:

- Free: $5/mo — light usage, a few deployments
- Team: $70/mo — heavy daily usage
- Business: $560/mo — large team, many concurrent sessions
- Enterprise: custom

When you hit your credit budget, chat sessions return a 402
(Payment Required) until either:

1. You upgrade your plan, OR
2. You set an overage cap (see below) and your overage usage hasn't
   exhausted that cap either, OR
3. The next month's budget resets on your billing anniversary

## Overage cap

`/settings → Billing → Overage cap`.

For Team and Business plans, you can opt into letting credit usage
exceed your plan budget by up to a configurable cap. After exceeding
the plan budget, additional usage is billed at the LLM provider's
pass-through rate + a ~40% markup on top.

Example:
- Team plan: $70/mo included credits
- Overage cap: $200
- Actual usage in October: $250

You're billed: $99 (plan) + ($250 - $70) × 1.40 = $99 + $252 =
$351 that month.

If you'd hit the overage cap mid-month, agents return 402 once your
overage usage exhausts the cap. You won't be billed for usage that
exceeds the cap.

Set the cap to `$0` to disable overage entirely (default for new
accounts) — guarantees you'll never be billed more than the plan
price.

## Limit enforcement

The platform enforces seat / agent / credit limits in real-time:

- **Seat limit hit** when inviting a new member → invite button
  disabled with "Upgrade to add more seats"
- **Active agent limit hit** when starting a new deployment with a
  not-yet-active agent → Gate 6 (deploy) blocks with "Plan limit:
  this agent would push your active-agent count above Team plan's
  3-agent limit. Upgrade?"
- **Credit limit hit** in any chat → message returns 402 with
  upgrade CTA

All limit errors include a one-click upgrade link.

## See your current usage

`/settings → Billing → Usage`.

Shows:

- Current plan + next billing date
- Seats: N / max (e.g., `3 / 5`)
- Active agents: N / max
- Credits: $X used / $Y included ($Z over)
- Per-agent credit breakdown (which agents are eating the most
  credits)

Admins + Owners see this; Members don't.

## Upgrade flow (current, while billing automation is in transit)

Email `support@hivedeploy.in` from your org's owner email with:

- Org slug (from your URL)
- Plan you want (Team / Business / Enterprise)
- Billing cycle (monthly / annual)

We'll generate a payment link and upgrade your org within 24 hours.
The upgrade is effective immediately — limits expand, agents resume
working, current usage retroactively benefits from the new tier's
included credits for the current billing period.

When the in-app upgrade flow is restored, this will be a self-serve
button.

## Downgrade

Same as upgrade — email support. We'll downgrade on your next
billing cycle (you keep current-plan benefits until the cycle ends).

If your usage exceeds the downgraded plan's limits at the cycle
boundary:

- **Seats:** removing members above the cap is your responsibility
  (we won't auto-remove someone)
- **Active agents:** newest deployments get paused (status
  `paused_over_limit`); they're not destroyed but can't be scaled
  or modified until you destroy enough to fit under the cap
- **Credits:** the new tier's lower credit budget kicks in for the
  new cycle

## Enterprise — custom contract

For orgs needing:

- SOC 2 report
- BAA (HIPAA)
- DPA (GDPR)
- SLA with credits for downtime
- Dedicated support engineer
- Higher rate limits / unlimited agents
- Custom deployment (your VPC, your cloud)
- Volume discount

Email `enterprise@hivedeploy.in` for a contract conversation.

## Invoices and tax

Invoices are generated monthly (or annually for annual plans). They
download as PDF from `/settings → Billing → Invoices`.

Tax:
- Indian customers (post-incorporation): GST charged per applicable
  rate, invoice marked as export-of-services where applicable
- US customers: sales tax charged based on your billing state (only
  ~10 states currently require it for SaaS)
- EU customers: VAT charged based on customer country; B2B
  customers can provide a VAT ID for reverse-charge
- Other regions: no tax charged currently

If you're billed via a payment-provider-of-record (e.g., Paddle),
they handle global tax compliance — your invoice will reflect that.

## Cancellation

`/settings → Billing → Cancel plan`.

Effect:
- Plan downgrades to Free at the end of your current billing cycle
- You keep paid-plan benefits until then
- Cloud accounts, deployments, audit history all retained
- Members above Free's 2-seat cap stay in the org but invites are
  blocked

To fully delete your org:

`/settings → Organization → Delete org`.

This:
- Marks all members as removed
- Detaches cloud accounts (your cloud-side IAM / WIF setup stays;
  the orchestrator just stops being able to access)
- Retains audit history for 30 days (for compliance / dispute), then
  purges
- Cannot be undone

## See also

- [Team management](/guides/team-management) — seat usage
- [Concepts — Agents](/concepts/agents) — what counts toward
  active-agent limit
- Email `support@hivedeploy.in` — for plan changes during the
  billing-automation migration
