# Deployment Checklist for Staging & Production

## Prerequisites (Before Deploying to Any Environment)

### 1. **Secrets Creation** ✅
Create secrets in the target namespace before deploying:

```bash
# For Staging
kubectl create namespace staging
kubectl create secret generic postgres-secret \
  --from-literal=username=incidents_user \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  -n staging

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=YOUR_OPENAI_API_KEY \
  -n staging

# For Production
kubectl create namespace prod
kubectl create secret generic postgres-secret \
  --from-literal=username=incidents_user \
  --from-literal=password=YOUR_PRODUCTION_PASSWORD \
  -n prod

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=YOUR_OPENAI_API_KEY \
  -n prod
```

### 2. **Database Migrations** ✅
After deploying PostgreSQL, run migrations:

```bash
# Copy migration files
kubectl cp backend/src/db/migrations/001_create_incidents_table.sql NAMESPACE/postgres-0:/tmp/
kubectl cp backend/src/db/migrations/002_add_status_and_features.sql NAMESPACE/postgres-0:/tmp/

# Execute migrations
kubectl exec -n NAMESPACE postgres-0 -- psql -U incidents_user -d incidents_db -f /tmp/001_create_incidents_table.sql
kubectl exec -n NAMESPACE postgres-0 -- psql -U incidents_user -d incidents_db -f /tmp/002_add_status_and_features.sql

# Add missing ai_metadata column (if needed)
kubectl exec -n NAMESPACE postgres-0 -- psql -U incidents_user -d incidents_db -c \
  "ALTER TABLE incidents ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;"
```

### 3. **Verify Configuration** ✅

Check all these configuration items are correct:

#### a. Network Policy Ports
- ✅ Frontend network policy allows port **8080** (not 80)
- ✅ Backend network policy allows port **3001**
- ✅ Ingress namespace selector: `kubernetes.io/metadata.name: ingress-nginx`
- ✅ DNS namespace selector: `kubernetes.io/metadata.name: kube-system`

#### b. Service Ports
- ✅ Frontend service targetPort: **8080** (matches nginx container)
- ✅ Backend service targetPort: **3001**
- ✅ PostgreSQL service port: **5432**

#### c. Environment Variables
- ✅ Database vars: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- ✅ Connection timeout: `DB_CONNECTION_TIMEOUT=10000`
- ✅ API URL: `VITE_API_URL=` (empty string, not `/api`)

#### d. Ingress Path Order
- ✅ `/api` path MUST come BEFORE `/` path
- ✅ Both paths use `pathType: Prefix`

#### e. Image Tags
- ✅ Use specific commit SHA tags (not `latest` in production)
- ✅ Verify images exist in container registry

## Deployment Steps

### Step 1: Deploy to Staging

```bash
# Set kubeconfig
export KUBECONFIG=/path/to/kubeconfig.yaml

# Create secrets (if not exists)
# ... (see Prerequisites section)

# Deploy
kubectl apply -k infra/k8s/overlays/staging

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ai-incident-assistant -n staging --timeout=300s

# Run migrations
# ... (see Prerequisites section)
```

### Step 2: Verify Staging

```bash
# Check all pods
kubectl get pods -n staging

# Check services and endpoints
kubectl get svc,endpoints -n staging

# Test backend API
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -n staging -- \
  curl http://backend:3001/api/incidents

# Test frontend
curl http://STAGING_INGRESS_IP/

# Check logs
kubectl logs -n staging -l app.kubernetes.io/component=backend --tail=50
kubectl logs -n staging -l app.kubernetes.io/component=frontend --tail=50
```

### Step 3: Deploy to Production

```bash
# Create secrets (if not exists)
# ... (see Prerequisites section with PRODUCTION passwords)

# Deploy
kubectl apply -k infra/k8s/overlays/prod

# Wait for pods
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=ai-incident-assistant -n prod --timeout=300s

# Run migrations
# ... (see Prerequisites section)
```

### Step 4: Verify Production

```bash
# Same verification steps as staging but with -n prod
kubectl get pods -n prod
kubectl get svc,endpoints -n prod

# Test API
kubectl run test-curl --image=curlimages/curl:latest --rm -i --restart=Never -n prod -- \
  curl http://backend:3001/api/incidents
```

## Common Issues & Solutions

### Issue 1: Frontend Shows "Failed to fetch"
**Cause**: `VITE_API_URL` using localhost fallback
**Solution**: Ensure `VITE_API_URL=` (empty) in ConfigMap and frontend image rebuilt

### Issue 2: 503/504 Errors from Ingress
**Cause**: Network policy blocking ingress-nginx
**Solution**: Network policy must allow port 8080 and use correct namespace selector

### Issue 3: Database Connection Errors
**Cause**: Wrong environment variable names or secrets
**Solution**: Use `DB_*` prefix (not `DATABASE_*`) and verify secrets exist

### Issue 4: "relation does not exist" Errors
**Cause**: Migrations not run
**Solution**: Run both migration scripts and add ai_metadata column

### Issue 5: 404 on /api/incidents
**Cause**: Ingress path order wrong
**Solution**: Move `/api` path before `/` path in ingress.yaml

## Health Check Commands

```bash
# Quick health check
kubectl get pods -n NAMESPACE
kubectl get ingress -n NAMESPACE

# Detailed check
kubectl describe deployment backend -n NAMESPACE
kubectl describe deployment frontend -n NAMESPACE
kubectl describe statefulset postgres -n NAMESPACE

# Test endpoints
curl http://INGRESS_IP/api
curl http://INGRESS_IP/api/incidents
curl http://INGRESS_IP/api/analytics/overview

# Check logs
kubectl logs -n NAMESPACE -l app.kubernetes.io/component=backend --tail=100
kubectl logs -n NAMESPACE -l app.kubernetes.io/component=frontend --tail=100
kubectl logs -n NAMESPACE postgres-0 --tail=100
```

## Rollback Procedure

If issues occur in staging or production:

```bash
# Check deployment history
kubectl rollout history deployment/backend -n NAMESPACE
kubectl rollout history deployment/frontend -n NAMESPACE

# Rollback to previous version
kubectl rollout undo deployment/backend -n NAMESPACE
kubectl rollout undo deployment/frontend -n NAMESPACE

# Or rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=N -n NAMESPACE
```

## ArgoCD Integration (Optional)

If using ArgoCD for GitOps:

1. Create ArgoCD Application for staging
2. Create ArgoCD Application for prod
3. Set sync policy to manual (not auto) for production
4. Always test in staging first

```yaml
# ArgoCD Application example
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/cloud-native-ci-cd-blueprint
    path: infra/k8s/overlays/staging
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    syncOptions:
    - CreateNamespace=true
    automated: null  # Manual sync only
```

## Monitoring & Alerts

Set up monitoring for:
- Pod restarts
- Container resource usage
- API response times
- Database connections
- Ingress traffic

---

**Last Updated**: 2025-12-09
**Tested Environments**: dev ✅, staging ⏳, prod ⏳
