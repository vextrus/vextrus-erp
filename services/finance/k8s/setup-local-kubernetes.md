# Local Kubernetes Setup Guide

## Step 1: Enable Kubernetes in Docker Desktop

### Windows Instructions:

1. **Open Docker Desktop**
   - Right-click Docker icon in system tray
   - Click "Dashboard" or "Settings"

2. **Navigate to Kubernetes Settings**
   - Click "Settings" (gear icon) in top-right
   - Click "Kubernetes" in left sidebar

3. **Enable Kubernetes**
   - Check the box: ☑ "Enable Kubernetes"
   - Click "Apply & Restart"

4. **Wait for Kubernetes to Start**
   - This may take 2-5 minutes
   - Watch for green "Kubernetes running" status indicator
   - You'll see "Kubernetes" in the bottom-left corner turn green

### Verification

After Kubernetes starts, verify in your terminal:

```bash
# Check Kubernetes is running
kubectl cluster-info

# Should see output like:
# Kubernetes control plane is running at https://kubernetes.docker.internal:6443
# CoreDNS is running at https://kubernetes.docker.internal:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

# Check nodes
kubectl get nodes

# Should see:
# NAME             STATUS   ROLES           AGE   VERSION
# docker-desktop   Ready    control-plane   Xm    v1.xx.x
```

---

## Step 2: Create Required Resources

Once Kubernetes is running, we'll create namespaces and secrets.

### Create Namespaces

```bash
kubectl create namespace vextrus-staging
kubectl create namespace vextrus-production
kubectl create namespace monitoring
```

### Create Secrets for Local Development

**Staging Secrets:**
```bash
kubectl create secret generic finance-db-staging -n vextrus-staging \
  --from-literal=host=host.docker.internal \
  --from-literal=username=postgres \
  --from-literal=password=postgres

kubectl create secret generic finance-secrets-staging -n vextrus-staging \
  --from-literal=jwt-secret=local-dev-jwt-secret-change-in-production \
  --from-literal=cors-origin=http://localhost:3000,http://localhost:4200 \
  --from-literal=eventstore-connection=esdb://host.docker.internal:2113?tls=false
```

**Production Secrets:**
```bash
kubectl create secret generic finance-db-production -n vextrus-production \
  --from-literal=host=host.docker.internal \
  --from-literal=username=postgres \
  --from-literal=password=postgres

kubectl create secret generic finance-secrets-production -n vextrus-production \
  --from-literal=jwt-secret=local-dev-jwt-secret-change-in-production \
  --from-literal=cors-origin=http://localhost:3000,http://localhost:4200 \
  --from-literal=eventstore-connection=esdb://host.docker.internal:2113?tls=false
```

**Note**: For local development, we use `host.docker.internal` to access services running on your host machine (PostgreSQL, EventStore, etc.)

---

## Step 3: Verify Setup

Run our pre-deployment checklist:

```bash
cd services/finance/k8s
./00-pre-deployment-checklist.sh
```

Expected: Most checks will pass. Some might warn about missing services (PostgreSQL, EventStore) which is OK for local testing.

---

## Troubleshooting

### Kubernetes Won't Start

1. **Check Docker Resources**
   - Docker Desktop → Settings → Resources
   - Ensure at least 4GB RAM allocated
   - Ensure at least 2 CPUs allocated

2. **Reset Kubernetes**
   - Docker Desktop → Settings → Kubernetes
   - Click "Reset Kubernetes Cluster"
   - Wait for restart

3. **Check WSL 2 (Windows)**
   - Docker Desktop should use WSL 2 backend
   - Settings → General → "Use WSL 2 based engine"

### kubectl Commands Not Working

```bash
# Verify kubectl context
kubectl config current-context
# Should show: docker-desktop

# If not, set context
kubectl config use-context docker-desktop
```

### Port Conflicts

If you have services already running on ports:
- PostgreSQL (5432)
- EventStore (2113)
- Kafka (9092)

You may need to adjust the connection strings in the secrets.

---

## Next Steps

Once Kubernetes is running and secrets are created:

1. Return to terminal
2. Confirm setup is complete
3. Proceed with Week 1 deployment

---

## Quick Commands Reference

```bash
# Check cluster status
kubectl cluster-info

# View all namespaces
kubectl get namespaces

# View secrets in namespace
kubectl get secrets -n vextrus-staging
kubectl get secrets -n vextrus-production

# View all pods
kubectl get pods --all-namespaces

# Delete everything and start over
kubectl delete namespace vextrus-staging
kubectl delete namespace vextrus-production
# Then recreate namespaces and secrets
```
