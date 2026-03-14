#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# OrbStack puts docker CLI here; add it to PATH if needed
export PATH="/Applications/OrbStack.app/Contents/MacOS/xbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$PROJECT_DIR"

IMAGE_TAG="${1:-latest}"

echo "============================================"
echo "  FinanceHub - K8s Deployment (k3d)"
echo "============================================"
echo ""

# 1. Check prerequisites
for cmd in docker k3d kubectl; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "ERROR: $cmd is not installed."
    exit 1
  fi
done
echo "[ok] Prerequisites: docker, k3d, kubectl"

# 2. Create k3d cluster (skip if exists)
if k3d cluster list 2>/dev/null | grep -q "finance-dashboard"; then
  echo "[ok] k3d cluster 'finance-dashboard' already exists"
else
  echo "[..] Creating k3d cluster..."
  k3d cluster create --config deploy/k3d-config.yaml
  echo "[ok] Cluster created"
fi

# 3. Build Docker image
echo "[..] Building Docker image (finance-dashboard:$IMAGE_TAG)..."
docker build -t "finance-dashboard:$IMAGE_TAG" -f deploy/Dockerfile .
echo "[ok] Image built"

# 4. Import image into k3d
echo "[..] Importing image into k3d cluster..."
k3d image import "finance-dashboard:$IMAGE_TAG" -c finance-dashboard
echo "[ok] Image imported"

# 5. Update image tag in deployment and apply manifests
echo "[..] Applying Kubernetes manifests..."
kubectl apply -f deploy/manifests/namespace.yaml
kubectl apply -f deploy/manifests/pvc.yaml

# Apply deployment with correct image tag
sed "s|finance-dashboard:v2|finance-dashboard:$IMAGE_TAG|" deploy/manifests/deployment.yaml | kubectl apply -f -

kubectl apply -f deploy/manifests/service.yaml
kubectl apply -f deploy/manifests/ingress.yaml
echo "[ok] Manifests applied"

# 6. Wait for rollout
echo "[..] Waiting for deployment to be ready..."
kubectl rollout status deployment/finance-dashboard -n finance --timeout=120s
echo "[ok] Deployment ready"

echo ""
echo "============================================"
echo "  FinanceHub is running!"
echo "  Open: http://localhost:8080"
echo "============================================"
echo ""
echo "Useful commands:"
echo "  kubectl get pods -n finance                          # Check pod status"
echo "  kubectl logs -n finance -l app=finance-dashboard -f  # View logs"
echo "  k3d cluster delete finance-dashboard                 # Tear down"
