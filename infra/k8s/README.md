# Kubernetes Deployment Guide
## AI Incident Assistant - Production-Grade Deployment

### Overview
This directory contains production-ready Kubernetes manifests using Kustomize for multi-environment deployment (dev, staging, prod).

### Architecture
```
infra/k8s/
├── base/                          # Base manifests (shared across environments)
│   ├── kustomization.yaml         # Base resources and labels
│   ├── backend-deployment.yaml    # Node.js API deployment
│   ├── frontend-deployment.yaml   # React frontend with Nginx
│   ├── postgres-statefulset.yaml  # PostgreSQL StatefulSet
│   ├── services.yaml              # ClusterIP services
│   ├── configmap.yaml             # Non-sensitive configuration
│   ├── ingress.yaml               # Nginx Ingress routes
│   ├── networkpolicy.yaml         # Zero-trust network policies
│   └── namespace.yaml             # Namespace definitions (manual apply)
└── overlays/
    ├── dev/                       # Development environment
    │   └── kustomization.yaml     # 1 replica, lower resources
    ├── staging/                   # Staging environment
    │   └── kustomization.yaml     # 2 replicas, moderate resources
    └── prod/                      # Production environment
        └── kustomization.yaml     # 3 replicas, full resources
```

### Prerequisites
1. DigitalOcean Kubernetes Cluster (ai-incident-assistant)
2. kubectl configured with cluster access
3. Nginx Ingress Controller installed (LoadBalancer: 174.138.120.13)
4. ArgoCD installed (LoadBalancer: 209.38.124.183)
5. Container images pushed to registry.digitalocean.com/ai-incident-assistant

### Step 1: Create Namespaces
```bash
kubectl apply -f infra/k8s/base/namespace.yaml
```

Verify namespaces:
```bash
kubectl get namespaces dev staging prod
```

<!-- ### Step 2: Create Secrets
Secrets must be created manually in each namespace:

```bash
# PostgreSQL credentials
kubectl create secret generic postgres-secret \
  --from-literal=username=incidents_user \
  --from-literal=password=12345q \
  -n dev

kubectl create secret generic postgres-secret \
  --from-literal=username=incidents_user \
  --from-literal=password=12345q \
  -n staging

kubectl create secret generic postgres-secret \
  --from-literal=username=incidents_user \
  --from-literal=password=12345q \
  -n prod

# Backend secrets (OpenAI API key)
kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=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 \
  -n dev

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=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 \
  -n staging

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=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 \
  -n prod
``` -->

Verify secrets:
```bash
kubectl get secrets -n dev
kubectl get secrets -n staging
kubectl get secrets -n prod
```

### Step 3: Test Kustomize Builds
Validate manifests before deployment:

```bash
# Test dev build
kubectl kustomize infra/k8s/overlays/dev

# Test staging build
kubectl kustomize infra/k8s/overlays/staging

# Test production build
kubectl kustomize infra/k8s/overlays/prod
```

### Step 4: Deploy via ArgoCD (Recommended)

#### Access ArgoCD UI
- URL: http://209.38.124.183
- Username: admin
- Password: 9p6FXw9-mH8TdcNe

#### Create Applications via Web UI

**Development Application:**
1. Click "+ NEW APP"
2. Application Name: `ai-incident-dev`
3. Project: `default`
4. Sync Policy: `Automatic`
5. Repository URL: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
6. Path: `infra/k8s/overlays/dev`
7. Cluster: `https://kubernetes.default.svc`
8. Namespace: `dev`
9. Click "CREATE"

**Staging Application:**
1. Click "+ NEW APP"
2. Application Name: `ai-incident-staging`
3. Project: `default`
4. Sync Policy: `Manual` (controlled deployments)
5. Repository URL: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
6. Path: `infra/k8s/overlays/staging`
7. Cluster: `https://kubernetes.default.svc`
8. Namespace: `staging`
9. Click "CREATE"

**Production Application:**
1. Click "+ NEW APP"
2. Application Name: `ai-incident-prod`
3. Project: `default`
4. Sync Policy: `Manual` (strict control)
5. Repository URL: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
6. Path: `infra/k8s/overlays/prod`
7. Cluster: `https://kubernetes.default.svc`
8. Namespace: `prod`
9. Click "CREATE"

### Step 5: Deploy Manually (Alternative)
If not using ArgoCD, deploy with kubectl:

```bash
# Deploy to dev
kubectl apply -k infra/k8s/overlays/dev

# Deploy to staging
kubectl apply -k infra/k8s/overlays/staging

# Deploy to production
kubectl apply -k infra/k8s/overlays/prod
```

### Step 6: Verify Deployments

```bash
# Check pods
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod

# Check services
kubectl get svc -n dev
kubectl get svc -n staging
kubectl get svc -n prod

# Check ingress
kubectl get ingress -n dev
kubectl get ingress -n staging
kubectl get ingress -n prod

# Check PVCs (PostgreSQL data)
kubectl get pvc -n dev
kubectl get pvc -n staging
kubectl get pvc -n prod
```

### Step 7: Access Applications

**Via Nginx Ingress (LoadBalancer IP: 174.138.120.13):**
- Frontend: `http://174.138.120.13/`
- Backend API: `http://174.138.120.13/api`

**For domain-based access (optional):**
1. Point DNS A record to 174.138.120.13
2. Update ingress.yaml with your domain
3. Install cert-manager for TLS certificates
4. Uncomment TLS section in ingress.yaml

### Environment-Specific Configurations

| Environment | Replicas | CPU Request | Memory Request | Auto-Sync |
|-------------|----------|-------------|----------------|-----------|
| Dev         | Backend: 1, Frontend: 1 | 50m-75m | 64Mi-96Mi | Yes |
| Staging     | Backend: 2, Frontend: 2 | 75m | 96Mi-192Mi | No |
| Prod        | Backend: 3, Frontend: 3 | 100m | 128Mi-256Mi | No |

### Resource Specifications

**Backend (Node.js API):**
- Dev: 50m CPU / 64Mi RAM → 200m CPU / 256Mi RAM
- Staging: 75m CPU / 96Mi RAM → 350m CPU / 384Mi RAM
- Prod: 100m CPU / 128Mi RAM → 500m CPU / 512Mi RAM

**Frontend (React + Nginx):**
- Dev: 25m CPU / 32Mi RAM → 100m CPU / 128Mi RAM
- Staging: 40m CPU / 48Mi RAM → 150m CPU / 192Mi RAM
- Prod: 50m CPU / 64Mi RAM → 200m CPU / 256Mi RAM

**PostgreSQL:**
- Dev: 50m CPU / 128Mi RAM → 250m CPU / 512Mi RAM
- Staging: 75m CPU / 192Mi RAM → 375m CPU / 768Mi RAM
- Prod: 100m CPU / 256Mi RAM → 500m CPU / 1Gi RAM

### Security Features
✅ **Security Contexts:** runAsNonRoot, readOnlyRootFilesystem where possible
✅ **Seccomp Profiles:** RuntimeDefault for all containers
✅ **Capability Drops:** All unnecessary capabilities dropped
✅ **Network Policies:** Zero-trust between components
✅ **Pod Anti-Affinity:** High availability across nodes
✅ **Resource Limits:** Prevent resource exhaustion
✅ **Health Probes:** Liveness and readiness checks
✅ **Secrets:** Sensitive data in Kubernetes Secrets

### High Availability Features
✅ **Multiple Replicas:** 3 replicas in production
✅ **Pod Anti-Affinity:** Spread across different nodes
✅ **Rolling Updates:** Zero-downtime deployments (maxSurge=1, maxUnavailable=0)
✅ **Health Checks:** Automatic pod restart on failures
✅ **PersistentVolume:** StatefulSet for database persistence

### Monitoring & Observability
- Prometheus annotations on backend pods (port 3001, /metrics endpoint)
- Structured logging with configurable LOG_LEVEL
- Application-level health endpoints (/health)

### Troubleshooting

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

**Database connection issues:**
```bash
# Check PostgreSQL logs
kubectl logs postgres-0 -n dev

# Exec into backend pod
kubectl exec -it <backend-pod> -n dev -- sh
# Test database connection
nc -zv postgres 5432
```

**Ingress not working:**
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress ai-incident-assistant -n dev
```

**Image pull errors:**
```bash
# Verify container registry access
kubectl get events -n dev | grep -i pull
```

### CI/CD Integration
The `.github/workflows/ci-pipeline.yml` automatically:
1. Builds Docker images on push to main branch
2. Tags images as `<env>-<git-sha>` and `<env>-latest`
3. Pushes to DigitalOcean Container Registry
4. Updates `infra/k8s/overlays/*/kustomization.yaml` with new image tags

ArgoCD with auto-sync will detect changes and deploy automatically (dev only).

### Cleanup

```bash
# Delete specific environment
kubectl delete -k infra/k8s/overlays/dev

# Delete all environments
kubectl delete -k infra/k8s/overlays/dev
kubectl delete -k infra/k8s/overlays/staging
kubectl delete -k infra/k8s/overlays/prod

# Delete namespaces (will delete all resources)
kubectl delete namespace dev staging prod
```

### Next Steps
1. ✅ Configure domain DNS
2. ✅ Install cert-manager for TLS
3. ✅ Set up Horizontal Pod Autoscaler (HPA)
4. ✅ Configure Prometheus + Grafana
5. ✅ Implement log aggregation (EFK stack)
6. ✅ Set up backup strategy for PostgreSQL
7. ✅ Configure resource quotas per namespace

### Support
- Cluster: do-blr1-ai-incident-assistant (Bangalore region)
- Nginx Ingress: 174.138.120.13
- ArgoCD: http://209.38.124.183
- Container Registry: registry.digitalocean.com/ai-incident-assistant
