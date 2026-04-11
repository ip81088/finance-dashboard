# FinanceHub — Deployment Guide

## Overview

FinanceHub runs locally inside a **k3d** (k3s in Docker) Kubernetes cluster managed by **OrbStack** on macOS. The app is packaged as a Docker image, imported directly into the cluster, and served at `http://localhost:8080`.

---

## Prerequisites

- [OrbStack](https://orbstack.dev) — provides the Docker runtime
- `k3d` — runs a lightweight k3s Kubernetes cluster inside Docker
- `kubectl` — Kubernetes CLI
- `node` / `npm` — only needed for local development (not for deployment)

---

## Deploying

A single script handles everything:

```bash
bash deploy/deploy.sh
```

Optionally pass an image tag (defaults to `latest`):

```bash
bash deploy/deploy.sh v2
```

### What the script does

1. **Checks prerequisites** — verifies `docker`, `k3d`, and `kubectl` are available.
2. **Creates the k3d cluster** (if it doesn't already exist) using `deploy/k3d-config.yaml`:
   - Cluster name: `finance-dashboard`
   - 1 server node, 0 agents
   - Port mapping: `localhost:8080 → cluster loadbalancer :80`
3. **Builds the Docker image** using `deploy/Dockerfile` with the tag `finance-dashboard:<tag>`.
4. **Imports the image** into the k3d cluster (bypasses a registry — images are loaded directly).
5. **Applies Kubernetes manifests** in order:
   - `namespace.yaml` — creates the `finance` namespace
   - `pvc.yaml` — creates a 1Gi `PersistentVolumeClaim` (`finance-data`) for the SQLite database
   - `deployment.yaml` — deploys the app (image tag is substituted via `sed`)
   - `service.yaml` — exposes the pod on port 80 → container port 3000
   - `ingress.yaml` — routes all traffic (`/`) through the k3d loadbalancer to the service
6. **Waits for rollout** — polls until the deployment is healthy (timeout: 120s).

---

## Docker Image

**`deploy/Dockerfile`** uses a two-stage build:

| Stage | Base | Purpose |
|-------|------|---------|
| `builder` | `node:20-alpine` | Installs all deps, runs `npm run build`, prunes to prod-only deps |
| `runner` | `node:20-alpine` | Copies only the built artifacts and prod `node_modules` |

The image exposes port `3000` and runs `deploy/entrypoint.sh` on startup.

---

## Container Startup (`entrypoint.sh`)

```
1. node init-db.mjs   — runs database migrations
2. next start         — starts the Next.js production server
```

### Database initialization (`init-db.mjs`)

- Opens (or creates) the SQLite database at `DATABASE_PATH` (defaults to `sqlite.db` in the working directory; in k8s this is `/data/sqlite.db`).
- Reads SQL migration files from the `drizzle/` directory in sorted order.
- Tracks applied migrations in a `_migrations` table to ensure idempotency.
- Handles pre-existing databases that predate migration tracking by detecting already-applied migrations from existing table names.

---

## Kubernetes Resources

| Resource | Kind | Details |
|----------|------|---------|
| `finance` | Namespace | Isolates all resources |
| `finance-data` | PersistentVolumeClaim | 1Gi, `local-path` storage class — persists the SQLite database across pod restarts |
| `finance-dashboard` | Deployment | 1 replica, `Recreate` strategy, mounts PVC at `/data` |
| `finance-dashboard` | Service | ClusterIP, port 80 → pod port 3000 |
| `finance-dashboard` | Ingress | Routes `/*` to the service via the k3d loadbalancer |

### Resource limits (Deployment)

| | Requests | Limits |
|-|----------|--------|
| Memory | 128Mi | 512Mi |
| CPU | 100m | 500m |

### Health checks

Both liveness and readiness probes hit `GET /api/accounts` on port 3000:
- **Readiness**: initial delay 5s, period 10s
- **Liveness**: initial delay 10s, period 30s

---

## Useful Commands

```bash
# Check pod status
kubectl get pods -n finance

# Stream logs
kubectl logs -n finance -l app=finance-dashboard -f

# Tear down the entire cluster
k3d cluster delete finance-dashboard
```

---

## Data Persistence

The SQLite database file lives at `/data/sqlite.db` inside the container, backed by the `finance-data` PVC. Data survives pod restarts and redeployments. The `Recreate` deployment strategy ensures the old pod fully stops before the new one starts, preventing concurrent writes to the SQLite file.
