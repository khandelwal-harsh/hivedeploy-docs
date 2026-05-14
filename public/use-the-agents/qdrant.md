
import { Callout } from '../../components/Callout'

> The Qdrant agent deploys and manages a Qdrant vector database cluster: sizing for your vector count and dimension, HNSW index configuration, scalar quantization, shard layout, snapshot backups to S3, and a recall harness for regression detection.

> **Note:** The Qdrant agent is in beta. It covers initial cluster deploy on EKS (AWS). GKE and AKS support, and managed Qdrant Cloud integration, are on the roadmap.

## What it deploys

- **Qdrant Helm release** — `replicaCount = 3`, gRPC (port 6334) + HTTP (port 6333), clustered mode enabled
- **EKS node group** — `r6i.xlarge` (4 vCPU, 32 GB RAM) × 3, spread across AZs
- **EBS gp3 PVCs** — 200 GB per node for persistent collection storage
- **S3 snapshot bucket** — snapshot CronJob every 6 hours; snapshots retained for 30 days
- **Collection bootstrap Job** — creates the first collection with your chosen vector size, HNSW parameters, and quantization config
- **Prometheus ServiceMonitor** — scrapes `/metrics` (request rate, P95 latency, index size, peer health)
- **Recall harness** — daily synthetic eval (1k known queries) posting recall@10 to Grafana

## Quickstart

1. **Start the agent:** "Deploy a Qdrant cluster for our RAG pipeline."
2. **Gate 1 — sizing inputs:** Agent asks for expected vector count, dimension, peak QPS, and whether you need hybrid search. Reply (e.g. 10M vectors, 1536 dim for OpenAI ada-002, 50 QPS).
3. **Gate 2 — topology:** Agent proposes a 3-node cluster with replication factor 2, 6 shards, HNSW `m=16 ef_construct=128`, scalar int8 quantization. Approve or ask for alternatives.
4. **Gate 3 — sizing confirmation:** Agent shows per-node memory math (raw vectors + HNSW graph overhead) and confirms `r6i.xlarge` fits the workload.
5. **Gate 4 — storage:** Agent proposes 200 GB gp3 per node + S3 snapshots every 6 hours. Approve.
6. **Gate 5 — observability:** Agent wires Prometheus + Grafana + alerts (peer down, P95 > 100 ms, index build queue > 60s). Approve.
7. **Gate 6 — review and deploy:** Terraform plan shows EKS cluster, Helm release, PVCs, S3 bucket, bootstrap Job. ~12 minutes.

After deploy the agent outputs:
- Qdrant HTTP endpoint: `http://qdrant.qdrant:6333` (internal)
- gRPC endpoint: `qdrant.qdrant:6334`
- S3 snapshot bucket name

## Configuration options

| Option | Default | Description |
|---|---|---|
| `node_count` | `3` | Qdrant replica nodes |
| `instance_type` | `r6i.xlarge` | EC2 instance type (memory-optimized recommended) |
| `storage_gb` | `200` | gp3 PVC size per node |
| `shard_number` | `6` | Shards per collection (2 per node for 3-node cluster) |
| `replication_factor` | `2` | Copies of each shard across nodes |
| `hnsw_m` | `16` | HNSW graph connectivity — higher = better recall, more RAM |
| `hnsw_ef_construct` | `128` | Build quality — higher = better recall, slower index build |
| `quantization` | `scalar-int8` | `none`, `scalar-int8`, or `product` (>100M vectors) |
| `snapshot_cron` | `0 */6 * * *` | CronJob schedule for S3 snapshots |

### Vector dimension → memory sizing

| Model | Dimension | Size per vector (int8) | 10M vectors (one replica) |
|---|---|---|---|
| BGE-base / MiniLM | 768 | 768 B | ~7 GB |
| OpenAI ada-002 | 1536 | 1.5 KB | ~14 GB |
| OpenAI text-3-large | 3072 | 3 KB | ~28 GB |

HNSW graph adds ~50% overhead. Plan `(raw_size × 1.5) + 30% headroom` per replica.

## Common patterns

### Creating a collection manually

After deploy you can create additional collections via the Qdrant REST API:

```bash
curl -X PUT http://qdrant.qdrant:6333/collections/my-collection \
  -H 'Content-Type: application/json' \
  -d '{
    "vectors": { "size": 1536, "distance": "Cosine", "on_disk": true },
    "shard_number": 6,
    "replication_factor": 2,
    "quantization_config": { "scalar": { "type": "int8", "always_ram": true } },
    "hnsw_config": { "m": 16, "ef_construct": 128 }
  }'
```

Tell the agent to create the collection and it will run this for you.

### Hybrid search (dense + sparse)

Qdrant 1.10+ supports built-in sparse vectors for hybrid search — no separate Elasticsearch or BM25 engine needed. Tell the agent: "Enable hybrid search on the `documents` collection." The agent adds a named sparse vector alongside the dense vector in the collection schema.

### Scaling up nodes

Tell the agent: "Add a 4th node to the Qdrant cluster."

The agent updates `replicaCount` in the Helm release, waits for the new peer to join, then proposes a shard rebalance.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Peer health check failing | Pod not yet joined the cluster (startup takes ~30s) | Wait; check pod logs for `Consensus reached` |
| P95 search latency > 100 ms | HNSW `ef` (search time param) too low, or quantization hurting recall | Increase `ef` in search requests; try disabling quantization on the problem collection |
| Index build queue backing up | Segment threshold too low for bulk insert rate | Increase `indexing_threshold` in the Helm config |
| Snapshot CronJob failing | S3 IAM permissions not attached to the pod service account | Check IRSA annotation on the snapshot service account |
| Out of disk space | Vector payload growing faster than expected | Grow PVC (edit Helm `persistence.size` and patch PVC) |
| Recall harness showing regression | Reindex with different HNSW params, or quantization error accumulation | Tune `m` and `ef_construct`; rebuild index |

## See also

- [Concepts: Agents](/concepts/agents)
- [Concepts: Gates](/concepts/gates)
- [Reference: Agents list](/reference/agents-list)
