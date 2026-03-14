# FinanceHub

Personal finance dashboard for tracking accounts, recurring income/expenses, transactions, and financial goals. Built with Next.js, SQLite, and Drizzle ORM. Deployed on Kubernetes via k3d.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Recharts
- **Backend**: Next.js API routes, SQLite (better-sqlite3), Drizzle ORM
- **Infrastructure**: k3d (k3s in Docker), OrbStack, multi-stage Docker build
- **Currency**: ILS (Israeli New Shekel)

## Features

- Net worth overview with asset/debt breakdown
- Multiple account types (main, savings, investment, debt)
- Recurring monthly income and expenses (auto-processed)
- Transaction tracking with spending-by-category charts
- Financial goals tracker
- Dark mode support

## Deploy to Kubernetes

Prerequisites: [OrbStack](https://orbstack.dev/) (or Docker Desktop) and [k3d](https://k3d.io/) installed.

**One-command deploy:**

```bash
./deploy/deploy.sh
```

This creates a k3d cluster, builds the Docker image, imports it, and applies all manifests. The app will be available at `http://localhost:8080`.

**Manual steps:**

```bash
# Create cluster
k3d cluster create finance-dashboard -p "8080:80@loadbalancer"

# Build and import image
docker build -f deploy/Dockerfile -t finance-dashboard:v12 .
k3d image import finance-dashboard:v12 -c finance-dashboard

# Apply manifests
kubectl apply -f deploy/manifests/

# Check status
kubectl -n finance get pods
```

**Stop/Start:**

```bash
k3d cluster stop finance-dashboard
k3d cluster start finance-dashboard
```

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project Structure

```
src/
  app/           # Next.js pages and API routes
  components/    # React components
  db/            # Schema, migrations, DB connection
  lib/           # Utilities
deploy/
  Dockerfile     # Multi-stage production build
  manifests/     # Kubernetes manifests (deployment, service, ingress, PVC)
  init-db.mjs    # Migration runner with tracking
  deploy.sh      # One-command deployment script
  K8S_GUIDE.md   # Kubernetes learning guide
drizzle/         # SQL migration files
```
