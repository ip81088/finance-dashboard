# Deploying a Next.js App to Kubernetes (k3d)

This documents every step taken to get a Next.js + SQLite app running in a local Kubernetes cluster using k3d.

---

## What's What

- **k3d**: Creates lightweight Kubernetes clusters by running k3s (minimal Kubernetes) inside Docker containers. Think of it as "Kubernetes in Docker."
- **k3s**: A stripped-down Kubernetes distribution. Same API, fewer moving parts. Comes with Traefik as its ingress controller.
- **OrbStack**: Docker Desktop alternative for macOS. Provides the Docker engine that k3d needs to run containers.
- **Traefik**: The ingress controller bundled with k3s. Routes external HTTP traffic to your services inside the cluster.

---

## Step 1: Containerize the App

Before Kubernetes can run anything, the app needs to be packaged as a Docker image.

### Dockerfile (`deploy/Dockerfile`)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++    # needed to compile better-sqlite3 (native C++ addon)
WORKDIR /app
COPY package*.json ./
RUN npm ci                                  # install all deps (including dev)
COPY . .
RUN npm run build                           # produce .next/ build output
RUN rm -rf node_modules && npm ci --omit=dev # reinstall without dev deps to shrink image

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules   # production deps only
COPY --from=builder /app/.next ./.next                 # build output
COPY --from=builder /app/public ./public               # static assets
COPY --from=builder /app/package.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/drizzle ./drizzle             # SQL migration files
COPY deploy/init-db.mjs ./init-db.mjs                  # DB init script
COPY deploy/entrypoint.sh ./entrypoint.sh              # startup script
RUN chmod +x entrypoint.sh
RUN mkdir -p /data                                     # directory for SQLite file
EXPOSE 3000
ENV HOSTNAME=0.0.0.0
ENTRYPOINT ["./entrypoint.sh"]
```

Why two stages:
- The builder stage has all the build tools (python3, make, g++, dev dependencies). It's big.
- The runner stage only copies what's needed at runtime. Much smaller.

### Entrypoint (`deploy/entrypoint.sh`)

```sh
#!/bin/sh
set -e
node init-db.mjs          # create tables if DB is empty
exec node_modules/.bin/next start   # start the server
```

`exec` replaces the shell process with the Node process, so signals (SIGTERM from Kubernetes) go directly to your app.

### DB Init (`deploy/init-db.mjs`)

```js
// Opens the SQLite file, checks if tables exist.
// If empty, reads the SQL migration files from ./drizzle/ and executes them.
// This runs every container start but only applies migrations once.
```

### Build the image

```bash
docker build -t finance-dashboard:v1 -f deploy/Dockerfile .
```

---

## Step 2: Create the Kubernetes Cluster

### Cluster config (`deploy/k3d-config.yaml`)

```yaml
apiVersion: k3d.io/v1alpha5
kind: Simple
metadata:
  name: finance-dashboard
servers: 1       # one k3s server node (control plane + worker)
agents: 0        # no separate worker nodes (server does everything)
ports:
  - port: 8080:80
    nodeFilters:
      - loadbalancer
```

The `ports` section is the key part. It tells k3d:
> "Map port 8080 on my Mac to port 80 on the k3d load balancer."

Traefik (the ingress controller inside k3s) listens on port 80. So:
```
Browser :8080 -> k3d LoadBalancer :80 -> Traefik -> Your Service -> Your Pod :3000
```

### Create the cluster

```bash
k3d cluster create --config deploy/k3d-config.yaml
```

This creates:
- A Docker container running k3s (`k3d-finance-dashboard-server-0`)
- A load balancer container (`k3d-finance-dashboard-serverlb`)
- A Docker network connecting them
- Automatically configures your `~/.kube/config` so `kubectl` points at this cluster

---

## Step 3: Get the Image into the Cluster

k3d clusters run inside Docker. They have their own container image registry, separate from your local Docker. You must import your image.

```bash
k3d image import finance-dashboard:v1 -c finance-dashboard
```

This saves the image as a tarball and loads it into the k3s node's containerd runtime.

---

## Step 4: Write the Kubernetes Manifests

Kubernetes doesn't know what your app is. You describe it with YAML manifests. Here's each one and why it exists.

### 4a. Namespace (`manifests/namespace.yaml`)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: finance
```

Namespaces isolate resources. Everything for this app goes in the `finance` namespace instead of cluttering `default`.

### 4b. PersistentVolumeClaim (`manifests/pvc.yaml`)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: finance-data
  namespace: finance
spec:
  accessModes:
    - ReadWriteOnce        # only one pod can mount it at a time
  storageClassName: local-path   # k3s built-in storage provisioner
  resources:
    requests:
      storage: 1Gi
```

Pods are ephemeral. If the pod dies, its filesystem is gone. A PVC gives you persistent storage that survives pod restarts. SQLite needs this because the database is a file on disk.

`local-path` is k3s's built-in storage provisioner. It creates a directory on the node and mounts it into the pod. Good enough for local dev.

### 4c. Deployment (`manifests/deployment.yaml`)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: finance-dashboard
  namespace: finance
spec:
  replicas: 1              # only 1 because SQLite can't handle concurrent writers
  strategy:
    type: Recreate          # kill old pod before starting new (avoids two pods writing to same DB)
  selector:
    matchLabels:
      app: finance-dashboard
  template:                 # this is the pod template
    metadata:
      labels:
        app: finance-dashboard
    spec:
      containers:
        - name: finance-dashboard
          image: finance-dashboard:v1
          imagePullPolicy: IfNotPresent   # don't try to pull from Docker Hub
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_PATH
              value: /data/sqlite.db      # tell the app where the DB file is
          volumeMounts:
            - name: data
              mountPath: /data            # mount the PVC at /data inside the container
          livenessProbe:                  # Kubernetes kills the pod if this fails
            httpGet:
              path: /api/accounts
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:                 # Kubernetes stops sending traffic if this fails
            httpGet:
              path: /api/accounts
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: 128Mi
              cpu: 100m
            limits:
              memory: 512Mi
              cpu: 500m
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: finance-data       # references the PVC from step 4b
```

Key decisions:
- **`imagePullPolicy: IfNotPresent`**: Since the image was imported locally (not from a registry), don't try to pull it.
- **`Recreate` strategy**: Default is `RollingUpdate` which runs old and new pods simultaneously. With SQLite, two pods writing to the same file = corruption.
- **Probes**: Kubernetes uses these to know if your app is healthy. `liveness` = "is it alive?", `readiness` = "can it serve traffic?"

### 4d. Service (`manifests/service.yaml`)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: finance-dashboard
  namespace: finance
spec:
  selector:
    app: finance-dashboard    # finds pods with this label
  ports:
    - port: 80                # the service listens on port 80
      targetPort: 3000        # forwards to port 3000 on the pod
```

A Service gives your pod(s) a stable internal DNS name: `finance-dashboard.finance.svc.cluster.local`. Pods come and go (new IPs each time), but the Service name stays the same.

### 4e. Ingress (`manifests/ingress.yaml`)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: finance-dashboard
  namespace: finance
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: finance-dashboard   # the Service from step 4d
                port:
                  number: 80
```

An Ingress tells the ingress controller (Traefik) how to route external HTTP traffic. This one says: "route all requests at `/` to the `finance-dashboard` service on port 80."

---

## Step 5: Apply Everything

```bash
kubectl apply -f deploy/manifests/namespace.yaml
kubectl apply -f deploy/manifests/pvc.yaml
kubectl apply -f deploy/manifests/deployment.yaml
kubectl apply -f deploy/manifests/service.yaml
kubectl apply -f deploy/manifests/ingress.yaml
```

Order matters for the first apply: namespace must exist before anything else can be created in it.

After the first time, you can apply them all at once:

```bash
kubectl apply -f deploy/manifests/
```

---

## Step 6: Verify

```bash
# Wait for the deployment to finish
kubectl rollout status deployment/finance-dashboard -n finance

# Check pod status
kubectl get pods -n finance

# Read logs
kubectl logs -n finance -l app=finance-dashboard

# Test it
curl http://localhost:8080/api/accounts
```

---

## The Full Traffic Flow

```
You (browser) -> localhost:8080
  -> k3d load balancer (Docker port mapping) -> port 80 inside cluster
    -> Traefik ingress controller (reads Ingress rules)
      -> Service "finance-dashboard" (port 80)
        -> Pod (port 3000)
          -> Next.js server
            -> SQLite at /data/sqlite.db (PVC)
```

---

## Common Commands

```bash
# Pod status
kubectl get pods -n finance

# Live logs
kubectl logs -n finance -l app=finance-dashboard -f

# Shell into the running container
kubectl exec -it -n finance deploy/finance-dashboard -- sh

# Restart the app
kubectl rollout restart deployment/finance-dashboard -n finance

# Stop the app (scale to 0)
kubectl scale deployment/finance-dashboard -n finance --replicas=0

# Start it again
kubectl scale deployment/finance-dashboard -n finance --replicas=1

# Stop the cluster (keeps state)
k3d cluster stop finance-dashboard

# Start the cluster
k3d cluster start finance-dashboard

# Delete everything
k3d cluster delete finance-dashboard
```

---

## Gotchas We Hit

1. **`next.config.ts` caused a crash in production.** Next.js saw the `.ts` extension and tried to install TypeScript at runtime. Fix: renamed to `next.config.mjs`.

2. **`imagePullPolicy: Never` didn't work.** Even after importing the image, Kubernetes said "image not present." Switching to `IfNotPresent` and using a non-`latest` tag (`v1`, `v2`, etc.) fixed it. The `latest` tag has special pull behavior in Kubernetes.

3. **Docker CLI not on PATH with OrbStack.** OrbStack doesn't add `docker` to PATH by default. The binary is at `/Applications/OrbStack.app/Contents/MacOS/xbin/docker`. The deploy script adds this to PATH.

4. **SQLite + multiple replicas = corruption.** SQLite uses file-level locking. Two pods writing to the same PVC will corrupt the database. Solution: `replicas: 1` and `strategy: Recreate`.
