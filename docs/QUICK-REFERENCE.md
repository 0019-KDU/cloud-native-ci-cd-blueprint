# GitOps Pipeline - Quick Reference

## 🚀 Daily Developer Workflow

```bash
# 1. Make changes to code
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add new feature"

# 2. Create PR to main
git push origin feature/my-feature
# Create PR on GitHub

# 3. After PR approval and merge to main:
# - CI pipeline runs automatically
# - Single image built with SHA tag
# - GitOps repo updated with new image tags
# - Dev environment auto-deploys
```

## 📊 Check Deployment Status

### GitHub Actions
```bash
# View recent workflow runs
gh run list --repo 0019-KDU/cloud-native-ci-cd-blueprint

# Watch current run
gh run watch
```

### ArgoCD
```bash
# Get application status
argocd app get ai-incident-assistant-dev
argocd app get ai-incident-assistant-staging
argocd app get ai-incident-assistant-prod

# Or use kubectl
kubectl get applications -n argocd
```

### Kubernetes
```bash
# Check pods
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod

# Watch deployments
kubectl get deployments -n dev -w
```

## 🎯 Deploy to Staging

```bash
# 1. Verify dev is healthy
kubectl get pods -n dev

# 2. Check what will be deployed
argocd app diff ai-incident-assistant-staging

# 3. Sync staging (manual approval)
argocd app sync ai-incident-assistant-staging

# Or via ArgoCD UI: Click "SYNC" button

# 4. Watch deployment
kubectl rollout status deployment/backend -n staging
kubectl rollout status deployment/frontend -n staging
```

## 🎯 Deploy to Production

```bash
# 1. Verify staging success
kubectl get pods -n staging

# 2. Run staging tests
npm run test:e2e:staging
npm run test:load:staging

# 3. Check production diff
argocd app diff ai-incident-assistant-prod

# 4. Sync production (manual approval)
argocd app sync ai-incident-assistant-prod

# Or via ArgoCD UI: Click "SYNC" button

# 5. Monitor production
kubectl get pods -n prod -w
```

## 🔄 Rollback

### Via Git (Recommended)
```bash
# 1. Navigate to GitOps repo
cd cloud-native-infrastructure

# 2. Find previous working commit
git log --oneline k8s/overlays/prod/kustomization.yaml

# 3. Revert to previous version
git revert <commit-sha>
git push origin main

# 4. ArgoCD will auto-detect and sync
```

### Via kubectl (Emergency)
```bash
# Rollback to previous revision
kubectl rollout undo deployment/backend -n prod
kubectl rollout undo deployment/frontend -n prod

# Check status
kubectl rollout status deployment/backend -n prod
```

## 🔍 Troubleshooting

### Pipeline Failed
```bash
# Check workflow logs
gh run view <run-id>

# Re-run failed jobs
gh run rerun <run-id>
```

### ArgoCD Sync Issues
```bash
# Check application health
argocd app get ai-incident-assistant-dev

# Force refresh
argocd app get ai-incident-assistant-dev --refresh

# Hard refresh (delete and recreate)
argocd app get ai-incident-assistant-dev --hard-refresh
```

### Image Pull Errors
```bash
# Check if secret exists
kubectl get secret ai-incident-assistant -n <namespace>

# Recreate registry secret
doctl registry kubernetes-manifest | kubectl apply -f - -n <namespace>
```

### Pod Crashing
```bash
# Check logs
kubectl logs -f deployment/backend -n <namespace>

# Check events
kubectl describe pod <pod-name> -n <namespace>

# Check resource constraints
kubectl top pods -n <namespace>
```

## 📝 Common Commands

### Build & Test Locally
```bash
# Backend
cd backend
npm install
npm test
npm run lint

# Frontend
cd frontend
npm install
npm run build
npm run lint
```

### Kustomize
```bash
# Preview what will be deployed
kustomize build k8s/overlays/dev
kustomize build k8s/overlays/staging
kustomize build k8s/overlays/prod

# Apply directly (not recommended, use ArgoCD)
kustomize build k8s/overlays/dev | kubectl apply -f -
```

### ArgoCD CLI
```bash
# Login
argocd login <argocd-url>

# List applications
argocd app list

# Sync specific app
argocd app sync <app-name>

# View sync history
argocd app history <app-name>

# Rollback to previous version
argocd app rollback <app-name> <revision>
```

## 🔐 Secrets Management

### Create Secrets
```bash
# PostgreSQL
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=<password> \
  --from-literal=POSTGRES_DB=incidents \
  -n <namespace>

# Backend
kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY=<your-key> \
  -n <namespace>
```

### View Secrets (base64 decoded)
```bash
kubectl get secret postgres-secret -n dev -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

### Update Secrets
```bash
kubectl delete secret backend-secrets -n <namespace>
kubectl create secret generic backend-secrets --from-literal=OPENAI_API_KEY=<new-key> -n <namespace>
kubectl rollout restart deployment/backend -n <namespace>
```

## 📈 Monitoring

### Resource Usage
```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -n dev
kubectl top pods -n staging
kubectl top pods -n prod
```

### Logs
```bash
# Stream logs
kubectl logs -f deployment/backend -n <namespace>

# Last 100 lines
kubectl logs --tail=100 deployment/backend -n <namespace>

# Previous pod logs (if crashed)
kubectl logs deployment/backend -n <namespace> --previous
```

### Events
```bash
# Namespace events
kubectl get events -n <namespace> --sort-by='.lastTimestamp'

# Specific resource events
kubectl describe pod <pod-name> -n <namespace>
```

## 🎨 Image Tags

### View Current Images
```bash
# Check what's deployed
kubectl get deployment backend -n dev -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check in GitOps repo
cat k8s/overlays/dev/kustomization.yaml | grep newTag
```

### Manual Image Update (Not Recommended)
```bash
# Update via kustomize edit (in GitOps repo)
cd k8s/overlays/dev
kustomize edit set image backend=registry.digitalocean.com/ai-incident-assistant/backend:abc123

# Commit and push
git add kustomization.yaml
git commit -m "chore: update backend to abc123"
git push origin main
```

## 🆘 Emergency Procedures

### Scale Down (Maintenance)
```bash
kubectl scale deployment backend --replicas=0 -n <namespace>
kubectl scale deployment frontend --replicas=0 -n <namespace>
```

### Scale Up
```bash
kubectl scale deployment backend --replicas=2 -n <namespace>
kubectl scale deployment frontend --replicas=2 -n <namespace>
```

### Delete and Recreate
```bash
kubectl delete deployment backend -n <namespace>
argocd app sync ai-incident-assistant-<env>
```

## 📚 Useful Links

- **GitHub Actions**: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions
- **ArgoCD UI**: http://<argocd-url>
- **Container Registry**: https://cloud.digitalocean.com/registry
- **Documentation**: docs/GITOPS-PIPELINE.md
