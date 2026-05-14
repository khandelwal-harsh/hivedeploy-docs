
import { Callout } from '../../components/Callout'

> The Python agent owns the full deploy lifecycle of Python services: containerised web APIs (FastAPI, Flask, Django), Lambda functions, background workers, and cron scripts — including Dockerfile generation, ECR image build via CodeBuild, Fargate task definitions, auto-scaling, and CloudWatch observability.

## What it deploys

| Mode | Frameworks | Target infra |
|---|---|---|
| **Fargate web** | FastAPI, Flask, Django | ECS Fargate + ALB + ECR + CodeBuild |
| **Lambda** | Any (container image) | Lambda + ECR (no Fargate) |
| **Kubernetes** | Any | Deployment + Service + HPA manifests on existing cluster |
| **Background worker** | Celery, ARQ, RQ | Fargate task (no ALB) + SQS DLQ |
| **Cron / batch** | Any | ECS Scheduled Task or AWS Batch |

All Fargate deployments include:
- ECR repository with lifecycle policy (keep last 20 images)
- CodeBuild project for image builds (no GitHub Actions coupling required)
- ALB with HTTP → HTTPS redirect (if ACM certificate provided)
- Auto-scaling on CPU utilization (target 70%, 2 → 10 tasks)
- CloudWatch log group with 30-day retention
- CloudWatch alarms: error rate > 1%, P95 latency > 1s, task crash-loop

> **Note:** The agent detects your framework from the repository. If it cannot find a Dockerfile it generates one automatically using the canonical template for your framework.

## Quickstart

A minimal happy-path for a FastAPI service on AWS Fargate:

1. **Start the agent:** "Deploy my FastAPI service to AWS."
2. **Gate 1 — framework detection:** Agent detects FastAPI from `pyproject.toml` / `requirements.txt`. Confirm, or tell it which framework you're using.
3. **Gate 2 — name and region:** Agent asks for a service name and AWS region; reply `api-service` and `us-east-1`.
4. **Gate 3 — cloud target:** Pick your connected AWS account from the dropdown.
5. **Gate 4 — sizing:** Agent proposes 1 vCPU / 2 GB memory, 2 min tasks. Adjust if needed.
6. **Gate 5 — review:** Agent renders the full Terraform plan (VPC, ECS cluster, ALB, ECR repo, CodeBuild, IAM roles, auto-scaling). Admin approves if enabled.
7. **Gate 6 — deploy:** `terraform apply` runs (~8 minutes for a fresh VPC + Fargate stack). CodeBuild triggers an image build from your repository.

After deploy the agent outputs:
- ALB DNS name (e.g. `api-service-alb-123456789.us-east-1.elb.amazonaws.com`)
- ECR repository URL
- CodeBuild project name for triggering future builds

## Configuration options

| Option | Default | Description |
|---|---|---|
| `framework` | Auto-detected | `fastapi`, `flask`, `django`, `lambda`, `script` |
| `cpu` | `1024` (1 vCPU) | Fargate task CPU units |
| `memory` | `2048` (2 GB) | Fargate task memory (MB) |
| `desired_count` | `2` | Initial number of running tasks |
| `min_capacity` | `2` | Auto-scaling floor |
| `max_capacity` | `10` | Auto-scaling ceiling |
| `app_port` | `8000` | Container port (8000 for FastAPI/Flask, 8501 for Streamlit) |
| `python_version` | `3.12` | Python version in generated Dockerfile |
| `acm_certificate_arn` | `""` | Leave empty for HTTP-only; set to enable HTTPS |

### Framework defaults

| Framework | WSGI/ASGI server | Start command | Port |
|---|---|---|---|
| FastAPI | Uvicorn | `uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4` | 8000 |
| Flask | Gunicorn | `gunicorn --bind 0.0.0.0:8000 --workers 4 src.main:create_app()` | 8000 |
| Django | Gunicorn | `gunicorn --bind 0.0.0.0:8000 --workers 4 myproject.wsgi:application` | 8000 |
| Lambda | N/A | Container image with `CMD ["handler.lambda_handler"]` | — |

> **Warning:** Never use `flask run` or `python manage.py runserver` in production. The agent enforces production-grade WSGI/ASGI servers. For Kubernetes and Fargate deployments, use ONE process per container — the orchestrator manages replicas.

## Common patterns

### Deploying a Django service

The agent handles the Django-specific pre-deploy steps:
- Runs `python manage.py collectstatic --noinput` at Docker build time (not container start)
- Configures an ECS init container to run `python manage.py migrate --noinput` before the service starts
- Sets `DEBUG=False`, `ALLOWED_HOSTS`, `SECRET_KEY` from Secrets Manager
- Sets `CSRF_COOKIE_SECURE=True` and `SESSION_COOKIE_SECURE=True`

Tell the agent: "Deploy my Django app. It needs Postgres." — it will chain to the Postgres agent to provision the database first.

### Triggering a new image build

After initial deploy, you do not need to re-run Terraform for a new code release. Tell the agent: "Build and deploy a new image from the `main` branch."

The agent triggers the CodeBuild project with an `environmentVariablesOverride` for `GIT_BRANCH` and `IMAGE_TAG`, then updates the ECS service to use the new image tag.

### Adding a Lambda function

Tell the agent: "Add a Lambda that processes S3 upload events."

The agent generates:
- Lambda container image Dockerfile
- ECR repository + CodeBuild project
- Lambda function resource with event source mapping
- IAM execution role with S3 read permissions
- Dead-letter SQS queue for failed invocations

### Scaling manually

Tell the agent: "Scale the API service to 5 tasks."

The agent updates `aws_appautoscaling_target.min_capacity` and `desired_count` — no Terraform redeploy of the VPC or ALB.

## Operational tasks

The agent monitors and handles:

| Signal | Action |
|---|---|
| ECS `RunningTaskCount < desired` (crash-loop) | Alerts with the last 50 lines of CloudWatch Logs |
| ALB HTTP 5xx rate > 1% | Shows top error log entries; proposes rollback |
| P95 latency > 1s | Profiles with X-Ray trace data if enabled |
| CPU > 85% sustained | Proposes scaling up to the next task size or increasing `max_capacity` |
| Lambda DLQ non-empty | Surfaces failed event payloads; helps diagnose handler errors |

### Observability stack

- **Structured logs:** CloudWatch Logs with JSON formatter. Log group `/ecs/<service-name>`.
- **Distributed tracing:** AWS X-Ray (5% sampling default, 100% for errors). OpenTelemetry if you have an existing OTLP collector.
- **Error tracking:** Sentry SDK integration (optional). Set `SENTRY_DSN` in Secrets Manager.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Container exits immediately | No `CMD` in Dockerfile or wrong entry point | Agent regenerates the Dockerfile with the canonical start command |
| `ModuleNotFoundError` at container start | Dev dependencies not installed; or wrong `CMD` path | Ensure `uv sync --frozen --no-dev` is in the build stage |
| 502 Bad Gateway from ALB | Health check path `/healthz` not returning 200 | Add a `/healthz` route; FastAPI has none by default |
| Django `DisallowedHost` error | `ALLOWED_HOSTS` missing the ALB DNS | Agent patches the environment variable in the task definition |
| Image build fails in CodeBuild | Git token expired or wrong branch name | Update the `GIT_TOKEN` parameter in SSM Parameter Store |
| Lambda cold start > 10s | Image too large or no provisioned concurrency | Agent offers to add `provisioned_concurrency_config` for critical paths |
| `recovery_window_in_days` error on Secrets Manager destroy | Secret in pending-deletion state blocks re-create | Agent always sets `recovery_window_in_days = 0`; re-run apply |

## See also

- [Concepts: Agents](/concepts/agents)
- [Concepts: Gates](/concepts/gates)
- [Reference: Agents list](/reference/agents-list)
- [Guides: Approvals](/guides/approvals)
