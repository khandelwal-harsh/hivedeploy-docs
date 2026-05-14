
import { Callout } from '../../components/Callout'

> For contributors adding a new domain-expert agent (a new database, framework, cloud service, or runtime) to the Hivedeploy orchestrator.

This guide walks through adding a new specialist from scratch, using the existing `postgres` agent as the reference implementation.

## Current specialist agents

The following specialists ship today:

`clickhouse` · `dotnet` · `elasticsearch` · `frontend` · `go` · `java` · `kafka` · `mongodb` · `mysql` · `nodejs` · `php` · `postgres` · `python` · `redis` · `ruby` · `rust`

Each is a narrow expert that owns one capability class and its full lifecycle (deploy, monitor, scale, tune). If your new agent is a different capability, follow this guide.

## Prerequisites

- Dev environment per [Self-host](/guides/self-host)
- Understand the [Agents concept](/concepts/agents) and [Gates flow](/concepts/gates)
- Familiar with Python async patterns and Terraform / Helm basics

## Step 1 — Create the specialist directory

```bash
cd backend-ai-orchestrator/app/domains/agents/specialists
mkdir my-agent
cd my-agent
touch __init__.py
mkdir memory skills
```

The directory tree mirrors every other specialist:

```
my-agent/
├── __init__.py
├── memory/           # knowledge files (read by the system prompt loader)
│   ├── iac_templates.md
│   ├── sizing.md
│   ├── observability.md
│   ├── runbooks.md
│   └── terraform_hard_rules.md
├── registry.py       # PROVISIONS + TEMPLATES + Agent entity
├── skills/           # callable tools the agent can invoke
│   ├── __init__.py
│   └── ...
└── system_prompt.py  # hand-tuned system prompt for this specialist
```

## Step 2 — Add the memory pack

The `memory/` folder is the specialist's knowledge base. The system prompt loader injects these files into the agent's context at conversation start (the runtime uses prompt caching, so they count as a single cached prefix block per session).

### Standard memory files

| File | Purpose |
|---|---|
| `iac_templates.md` | Complete, production-ready Terraform / Helm / YAML templates. No placeholders — every value must be filled in from conversation variables. |
| `sizing.md` | Instance sizing tables per cloud and workload tier. Memory and connection tuning formulas. |
| `observability.md` | Prometheus metrics, alert thresholds, cloud-native monitoring setup (CloudWatch, GMP, Azure Monitor). |
| `runbooks.md` | Step-by-step playbooks for failover, scaling, password rotation, restore, and common break-fix scenarios. |
| `terraform_hard_rules.md` | Non-negotiable IaC constraints (e.g. never use `gp2`, always set `deletion_protection = true`). The agent treats these as blocking rules, not suggestions. |

### Tips for writing good memory files

- Write for the agent, not a human reader. Use imperative voice: "Always set X", "Never use Y".
- Every IaC template must be runnable as-is. If you include a Terraform snippet it must have all required providers and variables.
- Cover all three major clouds (AWS, GCP, Azure) — the agent is expected to handle any cloud connection.
- Use `iac_templates.md` as the primary source of truth. `sizing.md` tables are derived from cloud documentation and capacity planning formulas.

## Step 3 — Write `registry.py`

The registry exposes the agent entity and declares its scope. Copy from an existing specialist:

```python
from app.domains.agents.entities import Agent, DeploymentTemplate
from app.domains.agents.specialists.my_agent.skills import ALL_NAMES, ALL_SCHEMAS, HANDLERS
from app.domains.agents.specialists.my_agent.system_prompt import SYSTEM_PROMPT

# PROVISIONS is the capability class this agent owns.
# Must match the entry in tests/unit/agents/scope/test_per_agent_provisions.py
PROVISIONS: list[str] = ["my_capability"]

TEMPLATES: list[DeploymentTemplate] = [
    DeploymentTemplate(
        id="my-agent-eks",
        name="My Agent on EKS",
        summary="One-line description of what this template deploys.",
        supported_providers=["aws"],
        best_for=["production"],
    ),
    # Add one DeploymentTemplate per topology variant
]

AGENT = Agent(
    id="my-agent",
    name="My Agent",
    description="Short human-readable description.",
    system_prompt=SYSTEM_PROMPT,
    tool_names=ALL_NAMES,
    tool_schemas=ALL_SCHEMAS,
    tool_handlers=HANDLERS,
    provisions=PROVISIONS,
    templates=TEMPLATES,
)
```

> **Warning:** Template `id` values **must** match the IDs in the frontend mock seed (`frontend-ai-orchestrator/lib/mock/seed/agents.ts`). Mismatches cause the mock UI to display blank cards.

## Step 4 — Declare `PROVISIONS` and add scope guardrails

Every specialist must declare exactly what it provisions and what it must never do.

### In `registry.py`

```python
PROVISIONS: list[str] = ["my_capability"]
```

This is used by the adversarial scope tests to ensure the agent never agrees to deploy something outside its capability class.

### In the system prompt

Add an explicit PROVISIONS block at the top of `system_prompt.py`:

```
## SCOPE GUARDRAILS
PROVISIONS = ["my_capability"]

You are the my-agent specialist. You deploy and manage <X> only.

You MUST REFUSE requests to deploy anything not in PROVISIONS:
- Databases → postgres agent
- Message queues → kafka agent
- Python services → python agent
- Any other runtime → the relevant specialist

If asked to do something outside your scope, reply: "I'm the my-agent specialist.
For [X], please start a [Y] agent session."
```

The chat-time policy block is injected automatically by the orchestrator engine — you do not need to duplicate it in the prompt.

## Step 5 — Add the mock LLM script (for local dev)

The frontend uses deterministic mock scripts for local development (no real LLM calls needed).

```bash
cd frontend-ai-orchestrator/lib/mock/llm-script
# Create my-agent.ts following the pattern of postgres.ts or python.ts
```

The script must:
1. Export a constant named `MY_AGENT_SCRIPT` of type `AgentScript`
2. Walk through the gate sequence (greet → propose_topology → sizing → review → deploying)
3. Include a `specPatch` on the `review` node with `estimatedCost`, `resources`, and `architecture`
4. Export from `index.ts` (add your export to the barrel file)

See `argocd.ts` or `qdrant.ts` for lean examples.

## Step 6 — Wire into the IaC taxonomy

The IaC taxonomy tracks every resource type any specialist can provision. Check if your new capability needs entries in:

```bash
backend-ai-orchestrator/app/domains/agents/scope/capabilities.py
backend-ai-orchestrator/app/domains/agents/scope/taxonomy.py
```

Add your capability to the capability registry so `test_every_capability_has_one_owner` passes.

## Step 7 — Add tests

### Scope guardrail tests

All adversarial scope tests live in `tests/unit/agents/scope/`. Add your agent to the expected provisions map:

```python
# tests/unit/agents/scope/test_per_agent_provisions.py
EXPECTED = {
    ...
    "my-agent": ["my_capability"],
}
```

Add adversarial prompts to `test_per_agent_scope.py`:

```python
@pytest.mark.parametrize("prompt", [
    "Deploy a Postgres database",
    "Set up Kafka",
    "Deploy my Python API",
])
def test_my_agent_refuses_out_of_scope(prompt):
    # Agent must respond with a refusal, not a deployment plan
    ...
```

### Memory pack consistency tests

Verify every required memory file is present and non-empty:

```python
def test_my_agent_memory_pack_complete():
    required = ["iac_templates.md", "sizing.md", "observability.md",
                "runbooks.md", "terraform_hard_rules.md"]
    base = Path("app/domains/agents/specialists/my_agent/memory")
    for f in required:
        assert (base / f).exists() and (base / f).stat().st_size > 0
```

### Running the full test suite

```bash
cd backend-ai-orchestrator
pytest tests/unit/agents/scope/ -v
```

All scope tests must pass before opening a PR.

## Step 8 — Update the agents-list reference

Add an entry to [reference/agents-list.mdx](/reference/agents-list) with the agent ID, capability class, supported clouds, and a one-line description.

## Step 9 — Open the PR

### PR checklist

- `registry.py` with `PROVISIONS`, `TEMPLATES`, and `AGENT`
- `memory/` folder with all 5 standard files (non-empty, no placeholders)
- `system_prompt.py` with scope guardrail block
- Skills in `skills/` with `ALL_NAMES`, `ALL_SCHEMAS`, `HANDLERS` exported
- Mock script in `frontend-ai-orchestrator/lib/mock/llm-script/my-agent.ts`
- Export added to `frontend-ai-orchestrator/lib/mock/llm-script/index.ts`
- Scope tests updated and passing
- `reference/agents-list.mdx` updated
- This how-to page (or a new one) added to `pages/use-the-agents/`

### PR title convention

```
feat(agents): add my-agent specialist
```

Tag the PR with `new-agent` label so it gets routed to the platform team for review.

## See also

- [Concepts: Architecture](/concepts/architecture)
- [Concepts: Agents](/concepts/agents)
- [Concepts: Gates](/concepts/gates)
- [Reference: Agents list](/reference/agents-list)
