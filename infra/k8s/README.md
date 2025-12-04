# Kubernetes GitOps Manifests

This directory contains Kubernetes deployment manifests managed with **Kustomize** for GitOps workflows.

## 📁 Directory Structure

```
infra/k8s/
├── base/                          # Base Kubernetes resources
│   ├── postgres-deployment.yaml   # PostgreSQL database
│   ├── backend-deployment.yaml    # Backend deployment + service
│   ├── frontend-deployment.yaml   # Frontend deployment + service
│   ├── ingress.yaml               # Ingress configuration
│   └── kustomization.yaml         # Base kustomization
│
└── overlays/                      # Environment-specific overlays
    ├── dev/
    │   ├── postgres-secret.yaml   # Dev DB password
    │   └── kustomization.yaml     # Dev: 1 replica, dev-latest, 10Gi storage
    ├── staging/
    │   ├── postgres-secret.yaml   # Staging DB password
    │   └── kustomization.yaml     # Staging: 2 replicas, staging-latest, 10Gi storage
    └── production/
        ├── postgres-secret.yaml   # Prod DB password (use secrets manager!)
        └── kustomization.yaml     # Production: 3 replicas, prod-latest, 50Gi storage
```

## 🚀 Quick Start

### Prerequisites
- Kubernetes cluster (1.25+)
- kubectl configured
- Kustomize 5.0+ (or use `kubectl -k`)
- Ingress controller (nginx)
- Cert-manager (for TLS)

### Deploy to Development

```bash
# Apply dev environment
kubectl apply -k infra/k8s/overlays/dev

# Verify deployment
kubectl get pods -n dev
kubectl get svc -n dev
kubectl get ingress -n dev
```

### Deploy to Staging

```bash
# Apply staging environment
kubectl apply -k infra/k8s/overlays/staging

# Check status
kubectl get pods -n staging -w
```

### Deploy to Production

```bash
# Apply production environment (requires approval)
kubectl apply -k infra/k8s/overlays/production

# Monitor rollout
kubectl rollout status deployment/backend -n production
kubectl rollout status deployment/frontend -n production
```

## 🎯 Environment Configuration

### Development
- **Namespace**: `dev`
- **Replicas**: 1 (backend), 1 (frontend), 1 (postgres)
- **Image Tags**: `dev-latest`
- **Domain**: `dev.yourdomain.com`, `dev-backend.yourdomain.com`
- **Database**: PostgreSQL 16-alpine, 10Gi storage
- **Resources**: Minimal (256Mi memory, 250m CPU)

### Staging
- **Namespace**: `staging`
- **Replicas**: 2 (backend), 2 (frontend), 1 (postgres)
- **Image Tags**: `staging-latest`
- **Domain**: `staging.yourdomain.com`, `staging-backend.yourdomain.com`
- **Database**: PostgreSQL 16-alpine, 10Gi storage
- **Resources**: Standard (512Mi memory, 500m CPU)

### Production
- **Namespace**: `production`
- **Replicas**: 3 (backend), 3 (frontend), 1 (postgres)
- **Image Tags**: `prod-latest`
- **Domain**: `yourdomain.com`, `backend.yourdomain.com`
- **Database**: PostgreSQL 16-alpine, 50Gi storage, increased resources
- **Resources**: High (1Gi memory, 1 CPU)

## 🔐 Secrets Management

### PostgreSQL Database

PostgreSQL is **automatically deployed** with the application. Secrets are managed per environment:

- **Dev**: `postgres-secret` with password `dev_password_123` (in `overlays/dev/postgres-secret.yaml`)
- **Staging**: `postgres-secret` with password `staging_password_456` (in `overlays/staging/postgres-secret.yaml`)
- **Production**: ⚠️ **CHANGE PASSWORD** in `overlays/production/postgres-secret.yaml`

**Database Connection Details**:
- **Host**: `postgres` (Kubernetes service name)
- **Port**: `5432`
- **Database**: `incident_assistant`
- **User**: `postgres`
- **Password**: From `postgres-secret`

### Backend Application Secrets

The backend automatically connects to PostgreSQL using the above credentials. You only need to add:

```bash
# Create namespace
kubectl create namespace dev

# Create OpenAI API key secret
kubectl create secret generic backend-secrets \
  --from-literal=openai-api-key=sk-YOUR_OPENAI_KEY \
  -n dev

# Create registry pull secret (if using private registry)
kubectl create secret docker-registry regcred \
  --docker-server=registry.digitalocean.com \
  --docker-username=YOUR_TOKEN \
  --docker-password=YOUR_TOKEN \
  -n dev
```

### ⚠️ Production Security Recommendations

**DO NOT commit production passwords to Git!** Use one of these approaches:

1. **Sealed Secrets** (Recommended):
```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.24.0/controller.yaml

# Create sealed secret
echo -n 'your-strong-password' | kubectl create secret generic postgres-secret \
  --dry-run=client \
  --from-file=POSTGRES_PASSWORD=/dev/stdin \
  -o yaml | kubeseal -o yaml > sealed-postgres-secret.yaml
```

2. **External Secrets Operator**:
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: postgres-secret
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: postgres-secret
  data:
  - secretKey: POSTGRES_PASSWORD
    remoteRef:
      key: prod/postgres-password
```

3. **HashiCorp Vault**:
```bash
vault kv put secret/postgres password="your-strong-password"
```

## 🛠️ Customization

### Update Image Tag

```bash
cd infra/k8s/overlays/dev

# Update backend image
kustomize edit set image \
  registry.digitalocean.com/ai-incident-assistant/backend:dev-abc1234-20251203-120000

# Update frontend image
kustomize edit set image \
  registry.digitalocean.com/ai-incident-assistant/frontend:dev-abc1234-20251203-120000

# Apply changes
kubectl apply -k .
```

### Scale Replicas

```bash
cd infra/k8s/overlays/production

# Scale backend to 5 replicas
kustomize edit set replicas backend=5

# Apply
kubectl apply -k .
```

### Update Resources

Edit `overlays/<env>/kustomization.yaml`:

```yaml
patches:
  - target:
      kind: Deployment
      name: backend
    patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/resources/requests/memory
        value: 1Gi
```

## 🗄️ Database Initialization

### Automatic Migration on Startup

The backend automatically runs database migrations on startup. Migrations are located in:
```
backend/src/db/migrations/
├── 001_create_incidents_table.sql
├── 002_add_status_and_features.sql
└── 003_add_ai_metadata.sql
```

### Manual Database Access

If you need to manually access PostgreSQL:

```bash
# Get PostgreSQL pod name
kubectl get pods -n dev -l app=postgres

# Connect to PostgreSQL
kubectl exec -it <postgres-pod-name> -n dev -- psql -U postgres -d incident_assistant

# Run SQL commands
\dt                    # List tables
\d incidents           # Describe incidents table
SELECT * FROM incidents LIMIT 5;
```

### Run Migrations Manually

```bash
# Copy migration files to pod
kubectl cp backend/src/db/migrations <postgres-pod-name>:/tmp/migrations -n dev

# Execute migrations
kubectl exec -it <postgres-pod-name> -n dev -- \
  psql -U postgres -d incident_assistant -f /tmp/migrations/001_create_incidents_table.sql
```

### Backup and Restore

**Backup**:
```bash
# Backup database
kubectl exec <postgres-pod-name> -n production -- \
  pg_dump -U postgres incident_assistant > backup.sql

# Backup to compressed file
kubectl exec <postgres-pod-name> -n production -- \
  pg_dump -U postgres -Fc incident_assistant > backup.dump
```

**Restore**:
```bash
# Restore from SQL file
cat backup.sql | kubectl exec -i <postgres-pod-name> -n production -- \
  psql -U postgres incident_assistant

# Restore from compressed dump
kubectl exec -i <postgres-pod-name> -n production -- \
  pg_restore -U postgres -d incident_assistant < backup.dump
```

## 🔄 GitOps with ArgoCD

### Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Create Applications

```bash
# Dev application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: dev
    path: infra/k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Staging application
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: staging
    path: infra/k8s/overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
EOF

# Production application (manual sync)
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: main
    path: infra/k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    syncOptions:
      - CreateNamespace=true
    # Manual sync for production
EOF
```

## 🔍 Monitoring

### Check Pod Status

```bash
# All environments
kubectl get pods -A | grep incident

# Specific environment
kubectl get pods -n dev -l app=backend
kubectl get pods -n dev -l app=frontend
```

### View Logs

```bash
# Backend logs
kubectl logs -n dev deployment/backend -f

# Frontend logs
kubectl logs -n dev deployment/frontend -f

# Previous logs (if crashed)
kubectl logs -n dev deployment/backend -p
```

### Debug Pod Issues

```bash
# Describe pod
kubectl describe pod <pod-name> -n dev

# Get events
kubectl get events -n dev --sort-by='.lastTimestamp'

# Exec into pod
kubectl exec -it <pod-name> -n dev -- /bin/sh
```

## 🔄 Rollback

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/backend -n production

# Rollback to previous version
kubectl rollout undo deployment/backend -n production

# Rollback to specific revision
kubectl rollout undo deployment/backend -n production --to-revision=3
```

### GitOps Rollback

```bash
# 1. Revert Git commit
git revert <commit-sha>
git push

# 2. ArgoCD syncs automatically (if auto-sync enabled)
# Or manually sync:
argocd app sync ai-incident-prod
```

## 📊 Health Checks

### Liveness Probe
- Checks if container is alive
- Restarts container if fails
- Endpoint: `GET /` (backend port 3001, frontend port 80)

### Readiness Probe
- Checks if container ready to accept traffic
- Removes from service if fails
- Same endpoint as liveness

## 🌐 Ingress Configuration

### Prerequisites

1. **Install Nginx Ingress Controller**:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml
```

2. **Install Cert-Manager** (for TLS):
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

3. **Create ClusterIssuer**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### DNS Configuration

Point your domains to Ingress LoadBalancer IP:

```bash
# Get LoadBalancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller

# Create DNS A records:
dev.yourdomain.com         → <LoadBalancer-IP>
dev-backend.yourdomain.com → <LoadBalancer-IP>
staging.yourdomain.com     → <LoadBalancer-IP>
yourdomain.com             → <LoadBalancer-IP>
```

## 🔧 Troubleshooting

### Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n dev

# Common issues:
# - ImagePullBackOff: Check registry credentials
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource limits and node capacity
```

### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n dev

# Test service internally
kubectl run -it --rm debug --image=busybox --restart=Never -n dev -- wget -O- http://backend:3001
```

### Ingress Not Working
```bash
# Check ingress status
kubectl describe ingress -n dev

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify TLS certificate
kubectl get certificate -n dev
kubectl describe certificate app-tls -n dev
```

## 📚 Additional Resources

- [Kustomize Documentation](https://kustomize.io/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

---

**Maintained by**: DevOps Team  
**Last Updated**: December 3, 2025
