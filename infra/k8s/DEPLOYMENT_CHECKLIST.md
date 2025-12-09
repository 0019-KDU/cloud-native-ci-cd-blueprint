# Quick Deployment Checklist
## AI Incident Assistant - Production-Grade K8s Deployment

### ✅ Pre-Deployment Verification

- [x] Kubernetes cluster created (do-blr1-ai-incident-assistant)
- [x] kubectl configured with cluster access
- [x] Nginx Ingress Controller installed (174.138.120.13)
- [x] ArgoCD installed (209.38.124.183)
- [x] Container Registry created (registry.digitalocean.com/ai-incident-assistant)
- [x] All 13 Kubernetes manifests created
- [x] Kustomize builds tested successfully (688 lines each)

### 📋 Deployment Steps

#### 1. Create Namespaces
```bash
kubectl apply -f infra/k8s/base/namespace.yaml
kubectl get namespaces dev staging prod
```

#### 2. Create Secrets in Each Namespace
```bash
# PostgreSQL secrets
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

# Backend secrets (OpenAI API)
kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=sk-svcacct-... \
  -n dev

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=sk-svcacct-... \
  -n staging

kubectl create secret generic backend-secret \
  --from-literal=openai-api-key=sk-svcacct-... \
  -n prod
```

#### 3. Create ArgoCD Applications

**Login to ArgoCD:**
- URL: http://209.38.124.183
- Username: `admin`
- Password: `9p6FXw9-mH8TdcNe`

**Create Dev Application (Auto-sync):**
- Name: `ai-incident-dev`
- Repo: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
- Path: `infra/k8s/overlays/dev`
- Namespace: `dev`
- Sync Policy: **Automatic**

**Create Staging Application (Manual):**
- Name: `ai-incident-staging`
- Repo: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
- Path: `infra/k8s/overlays/staging`
- Namespace: `staging`
- Sync Policy: **Manual**

**Create Prod Application (Manual):**
- Name: `ai-incident-prod`
- Repo: `https://github.com/<your-username>/cloud-native-ci-cd-blueprint`
- Path: `infra/k8s/overlays/prod`
- Namespace: `prod`
- Sync Policy: **Manual**

#### 4. Verify Deployments
```bash
# Check all pods
kubectl get pods -A

# Check specific environment
kubectl get all -n dev
kubectl get all -n staging
kubectl get all -n prod

# Check persistent volumes
kubectl get pvc -n dev -n staging -n prod

# Check ingress
kubectl get ingress -A
```

#### 5. Access Application
- Frontend: `http://174.138.120.13/`
- Backend API: `http://174.138.120.13/api`
- Health Check: `http://174.138.120.13/api/health`

### 🎯 Success Criteria

- [ ] All namespaces created (dev, staging, prod)
- [ ] Secrets created in all namespaces
- [ ] ArgoCD applications created and synced
- [ ] All pods in Running state
- [ ] PostgreSQL StatefulSet running with PVC bound
- [ ] Services created and endpoints populated
- [ ] Ingress routing traffic correctly
- [ ] Frontend accessible via browser
- [ ] Backend API responding to health checks
- [ ] Database migrations completed

### 🔍 Validation Commands

```bash
# Check pod status
kubectl get pods -n dev -o wide

# Check backend health
kubectl exec -it <backend-pod> -n dev -- wget -O- http://localhost:3001/health

# Check database connection
kubectl exec -it postgres-0 -n dev -- psql -U incidents_user -d incidents_db -c "SELECT version();"

# Check logs
kubectl logs -f <backend-pod> -n dev
kubectl logs -f <frontend-pod> -n dev
kubectl logs -f postgres-0 -n dev

# Check ingress routing
curl http://174.138.120.13/
curl http://174.138.120.13/api/health
```

### 📊 Resource Summary

**Total Files Created:** 13
- Base: 8 manifests + 1 kustomization.yaml + 1 namespace.yaml
- Overlays: 3 kustomization.yaml files (dev, staging, prod)
- Documentation: 1 README.md

**Generated Manifests:** 688 lines per environment
- Backend Deployment: 152 lines
- Frontend Deployment: 119 lines
- PostgreSQL StatefulSet: 118 lines
- Services: 55 lines
- Ingress: 75 lines
- NetworkPolicies: 169 lines

**Security Features:**
✅ RunAsNonRoot for all containers
✅ ReadOnlyRootFilesystem where possible
✅ Seccomp profiles (RuntimeDefault)
✅ Capability drops (ALL)
✅ Network policies (zero-trust)
✅ Pod anti-affinity (HA)
✅ Resource limits (prevent exhaustion)
✅ Health probes (liveness + readiness)

**High Availability:**
✅ Multiple replicas (3 in prod, 2 in staging, 1 in dev)
✅ Pod anti-affinity rules
✅ Rolling updates (zero downtime)
✅ Health checks (auto-restart)
✅ StatefulSet for database (persistent storage)

### 🚨 Troubleshooting

**Pods in CrashLoopBackOff:**
- Check logs: `kubectl logs <pod-name> -n <namespace>`
- Verify secrets exist: `kubectl get secrets -n <namespace>`
- Check environment variables: `kubectl describe pod <pod-name> -n <namespace>`

**Image pull errors:**
- Verify registry access
- Check image tags in kustomization.yaml
- Ensure images are pushed to registry

**Database connection failures:**
- Verify PostgreSQL pod is running: `kubectl get pods -n dev | grep postgres`
- Check service endpoints: `kubectl get endpoints postgres -n dev`
- Verify secrets: `kubectl get secret postgres-secret -n dev -o yaml`

**Ingress not routing:**
- Check ingress controller: `kubectl get pods -n ingress-nginx`
- Verify LoadBalancer IP: `kubectl get svc -n ingress-nginx`
- Check ingress rules: `kubectl describe ingress -n dev`

### 📝 Next Actions

1. **Push to Git:**
   ```bash
   cd d:\devops94\cloud-native-ci-cd-blueprint
   git add infra/k8s/
   git commit -m "feat: Production-grade Kubernetes manifests with Kustomize"
   git push origin main
   ```

2. **Deploy Secrets:**
   Run the secret creation commands above

3. **Create ArgoCD Apps:**
   Login to ArgoCD UI and create 3 applications

4. **Monitor Deployments:**
   Watch ArgoCD sync status and pod creation

5. **Validate Application:**
   Test frontend and backend endpoints

### 🎉 Deployment Complete!

Once all checks pass:
- Development environment auto-syncs via ArgoCD
- Staging/Production require manual sync approval
- CI/CD pipeline will update image tags automatically
- Zero-downtime deployments via rolling updates

---

**Cluster Info:**
- Region: Bangalore (do-blr1)
- Nodes: 2 (pool-7djriva1i)
- Kubernetes Version: v1.34.1
- Nginx Ingress: 174.138.120.13
- ArgoCD: 209.38.124.183
- Registry: registry.digitalocean.com/ai-incident-assistant
