
import { Callout } from '../../components/Callout'

The orchestrator ships ~140 specialist agents across 22 categories.
Each is independently invocable from `/agents → click the agent`.

Status legend:

- ✅ Available — fully implemented for the listed clouds
- 🚧 Beta — implemented but limited cloud coverage; expanding
- 🔜 Coming soon — designed and queued; not yet implemented

## Language backends

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `python` | ✅ | AWS, GCP, Azure, K8s | Containerized Python service (Cloud Run / Lambda / Functions / Deployment) with health checks, secrets, autoscaling |
| `java` | ✅ | AWS, GCP, Azure, K8s | JVM service container, JVM-tuned defaults |
| `nodejs` | ✅ | AWS, GCP, Azure, K8s | Node.js service container, Node-tuned defaults |
| `go` | ✅ | AWS, GCP, Azure, K8s | Go binary in scratch container, tiny image |
| `rust` | ✅ | AWS, GCP, Azure, K8s | Rust binary deployment |
| `dotnet` | ✅ | AWS, GCP, Azure, K8s | .NET service deployment |
| `ruby` | ✅ | AWS, GCP, Azure, K8s | Rails / Sinatra service deployment |
| `php` | ✅ | AWS, GCP, Azure, K8s | PHP-FPM / Laravel deployment |

## Frontend & Mobile

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `frontend` | ✅ | Cloudflare Pages, Vercel, AWS Amplify, GCP / Azure Static Sites, S3+CloudFront | Per-framework deployment (Next.js, React SPA, Vue, Angular, Astro, SvelteKit) |
| `mobile` | 🚧 | AWS Device Farm, Firebase | Build pipelines + distribution channels for iOS / Android |

## Relational & Document Databases

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `postgres` | ✅ | AWS RDS, GCP Cloud SQL, Azure Postgres, K8s | Postgres 12-16, primary+replica, backups, PITR |
| `mysql` | ✅ | AWS RDS, GCP Cloud SQL, Azure MySQL, K8s | MySQL 8 with replication |
| `mongodb` | ✅ | AWS DocumentDB, Atlas, K8s | Replica set, sharding for large workloads |
| `cockroachdb` | 🚧 | AWS, GCP, Azure | Cockroach cluster, multi-region |
| `spanner` | ✅ | GCP only | Spanner instance, multi-region |
| `cosmosdb` | ✅ | Azure only | Cosmos DB account, multi-API |
| `turso` | 🚧 | Turso Cloud | libSQL / SQLite-edge |
| `surrealdb` | 🚧 | K8s | SurrealDB cluster |
| `database` | ✅ | — | Meta-agent that resolves to the right specialist when you don't know which DB you want |

## NoSQL & Wide-Column

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `cassandra` | ✅ | AWS Keyspaces, K8s | Cassandra cluster, multi-DC |
| `dynamodb` | ✅ | AWS only | DynamoDB tables, GSIs, autoscaling |
| `neo4j` | 🚧 | AWS, GCP, Azure, K8s | Neo4j cluster |

## Caching & Search

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `redis` | ✅ | AWS ElastiCache, GCP Memorystore, Azure Cache, K8s | Redis cluster |
| `elasticsearch` | ✅ | AWS OpenSearch, Elastic Cloud, K8s | Elasticsearch cluster |
| `algolia` | ✅ | Algolia | Index, replicas, API keys |
| `typesense` | 🚧 | Typesense Cloud, K8s | Typesense cluster |
| `meilisearch` | 🚧 | Meilisearch Cloud, K8s | Meilisearch instance |

## Analytical & Lakehouse

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `clickhouse` | ✅ | ClickHouse Cloud, AWS, GCP, Azure, K8s | ClickHouse cluster |
| `snowflake` | ✅ | Snowflake (any cloud) | Snowflake account, warehouses, databases |
| `databricks` | 🚧 | AWS, GCP, Azure | Databricks workspace |
| `bigquery` | ✅ | GCP only | Datasets, tables, scheduled queries |
| `redshift` | ✅ | AWS only | Redshift cluster, RA3 nodes |
| `duckdb` | 🚧 | Any (embedded) | DuckDB integrations |
| `trino` | 🚧 | K8s | Trino coordinator + workers |
| `spark` | 🚧 | AWS EMR, GCP Dataproc, Databricks | Spark cluster |
| `iceberg` | 🚧 | AWS S3 + Athena, GCS + BigLake | Iceberg tables with catalog |

## Vector & AI Databases

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `qdrant` | ✅ | Qdrant Cloud, K8s | Qdrant cluster |
| `pinecone` | ✅ | Pinecone | Index, serverless or pod-based |
| `weaviate` | 🚧 | Weaviate Cloud, K8s | Weaviate cluster |
| `chroma` | 🚧 | K8s | Chroma instance |
| `milvus` | 🚧 | Milvus Cloud, K8s | Milvus cluster |
| `pgvector` | ✅ | AWS RDS, GCP Cloud SQL, Azure Postgres, K8s | Postgres with pgvector extension |

## ML / Model Serving

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `vllm` | ✅ | AWS, GCP, Azure (GPU instances), K8s | vLLM inference server |
| `mlflow` | 🚧 | AWS, GCP, Azure, K8s | MLflow tracking server + artifact store |
| `kubeflow` | 🚧 | K8s | Kubeflow Pipelines |
| `bentoml` | 🚧 | AWS, GCP, Azure, K8s | BentoML service |
| `kserve` | 🚧 | K8s | KServe inference services |
| `triton` | 🚧 | AWS, GCP, Azure, K8s | Triton Inference Server |
| `ollama` | ✅ | K8s, self-host | Ollama instance for local-LLM-style deployments |
| `ray-serve` | 🚧 | K8s, AWS EMR | Ray Serve cluster |

## LLM-App & Agentic Infra

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `langchain` | 🚧 | Hosted, K8s | LangChain Serve deployments |
| `langsmith` | 🚧 | LangSmith Cloud | Project + traces |
| `llamaindex` | 🚧 | Hosted, K8s | LlamaIndex deployments |

## Streaming & Messaging

| Agent | Status | Supports | What it deploys |
|---|---|---|---|
| `kafka` | ✅ | AWS MSK, Confluent Cloud, K8s | Kafka cluster, topics, ACLs |
| `rabbitmq` | ✅ | CloudAMQP, K8s | RabbitMQ cluster |
| `nats` | 🚧 | NATS Cloud, K8s | NATS cluster, JetStream |
| `pulsar` | 🚧 | StreamNative, K8s | Pulsar cluster |
| `redpanda` | 🚧 | Redpanda Cloud, K8s | Redpanda cluster |
| `kinesis` | ✅ | AWS only | Kinesis streams |
| `sqs-sns` | ✅ | AWS only | SQS queues + SNS topics |

## CI/CD & GitOps

`argocd`, `github-actions`, `gitlab-ci`, `harness`, `jenkins`,
`circleci`, `tekton`, `flux`, `spinnaker`, `azure-pipelines`,
`buildkite`

All ✅ for their respective platforms (some platform-specific only).
Each agent walks you through pipeline templates appropriate for the
service being deployed.

## Kubernetes & Service Mesh

`eks`, `kubernetes` (generic), `helm`, `kustomize`, `karpenter`,
`istio`, `linkerd`, `cilium`, `consul`

All ✅. The `kubernetes` agent is the meta-agent for any K8s
provisioning regardless of cloud (EKS / GKE / AKS / self-managed).
`eks` is the AWS-specific specialist with deeper EKS-only knowledge.

## Observability

`prometheus`, `datadog`, `newrelic`, `grafana`, `honeycomb`,
`splunk`, `sentry`, `opentelemetry`

All ✅. Each agent wires up the observability tool against your
existing deployments — picks the right exporter, configures
dashboards, sets up alerting.

## Incident & On-Call

`pagerduty`, `opsgenie`, `incident-io`, `rootly`, `firehydrant`

All ✅ for their respective platforms. Useful for the
"deployment-just-failed → page on-call" automation flow.

## Security & Compliance

`vault`, `snyk`, `wiz`, `aqua`, `tfsec`, `opa`

`vault`, `tfsec`, `opa` ✅. Others 🚧.

## Identity & Auth

`okta`, `auth0`, `clerk`, `keycloak`, `cognito`, `firebase-auth`

All ✅ except keycloak (🚧). Each integrates an identity provider
into your services.

## API Gateway & Integration

`kong`, `apigee`, `postman`, `tyk`, `apollo`

`kong`, `apollo` ✅. Others 🚧.

## CDN & Edge

`cloudflare`, `fastly`, `cloudfront`, `akamai`, `deno-deploy`

`cloudflare`, `cloudfront` ✅. Others 🚧.

## Object Storage

`s3` (AWS), `gcs` (GCP), `azure-blob`, `minio` (self-host)

All ✅. Provisions buckets/containers with lifecycle rules, IAM,
encryption.

## Notifications, Email & SMS

`twilio`, `sendgrid`, `mailgun`, `resend`, `knock`

All ✅. Each agent provisions the account API key setup +
wire-into-your-app pattern.

## Payments

`stripe`, `adyen`, `paddle`

All 🚧. The platform itself is in the middle of switching off
Stripe — these agents are the customer-facing payment-integration
specialists, not our internal billing.

## Data ETL & Catalog

`airflow`, `dbt`, `airbyte`, `fivetran`, `prefect`, `dagster`,
`atlan`, `datahub`

`airflow`, `dbt`, `prefect`, `dagster` ✅. Others 🚧.

## IaC & Cloud Platforms

`terraform`, `pulumi`, `aws-cdk`, `cloudformation`, `crossplane`,
`ansible`, `aws-q`, `azure-copilot`, `gcp-duet`

`terraform`, `pulumi`, `aws-cdk`, `ansible` ✅. Others 🚧.

Note: the orchestrator itself uses `terraform` under the hood for
most deployments. The `terraform` agent is for customers who want
to set up Terraform-based IaC pipelines as part of their stack.

## Container Registries

`ecr`, `gar`, `acr`, `harbor`, `artifactory`

All ✅. Wires up auth + lifecycle policies.

## Testing & QA

`playwright`, `cypress`, `k6`, `mabl`

All 🚧. Each agent wires test pipelines into your CI.

## Workflow & Automation

`temporal`, `n8n`, `zapier`

`temporal`, `n8n` ✅. `zapier` 🚧.

## Feature Flags & Experimentation

`launchdarkly`, `statsig`, `growthbook`, `optimizely`

All 🚧.

## Web3 & Blockchain

`hardhat`, `foundry`

Both 🚧.

## How to invoke an agent

- **Catalog:** `/agents → click the agent → Start a deployment`
- **Cmd+K:** `⌘K → type natural language → orchestrator routes to the right agent`
- **Within a session:** `@agent-id` to bring another specialist in

## What's missing from this list (intentionally)

- Cloud-platform specialists (AWS-specific, GCP-specific Azure-specific
  meta-agents) — those are handled implicitly via Gate 3
- Self-coded agents — you can't currently define your own agent;
  the specialist set is curated by the platform

## See also

- [Concepts — Agents](/concepts/agents) — how agents work
- [Concepts — Multi-cloud](/concepts/multi-cloud) — which
  clouds each agent supports
- [Quickstart](/quickstart) — first deployment walkthrough
