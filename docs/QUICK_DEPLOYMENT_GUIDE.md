# 🚀 Quick Deployment Guide

## TL;DR - Common Commands

### Run Staging Tests
```bash
# Trigger via GitHub CLI
gh workflow run staging-validation.yml

# Or via GitHub UI
# Navigate to Actions → Staging Validation Tests → Run workflow
```

### Deploy to Production
```bash
# Get the image tag (git commit SHA)
IMAGE_TAG=$(git rev-parse HEAD)

# Trigger production deployment
gh workflow run production-deployment.yml -f image_tag=$IMAGE_TAG

# This will:
# 1. Create a deployment PR
# 2. Wait for manual approval
# 3. Send Slack notification to sync ArgoCD
# 4. Run smoke tests after deployment
```

---

## 📋 Daily Workflow

### Developer Workflow
```bash
# 1. Develop feature
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 2. Create PR
gh pr create --title "feat: add new feature" --body "Description"

# 3. CI runs automatically on PR
# - Unit tests
# - Linting
# - Build validation

# 4. After PR approval, merge to main
gh pr merge --squash

# 5. CI pipeline runs on main
# - Builds images
# - Pushes to registry
# - Updates K8s manifests
# - Auto-deploys to DEV

# 6. Verify in DEV
curl http://174.138.120.13/api/health
```

### Staging Deployment
```bash
# 1. Login to ArgoCD
# URL: http://209.38.124.183
# User: admin / 9p6FXw9-mH8TdcNe

# 2. Select "ai-incident-staging" application

# 3. Click "Sync" button

# 4. Wait for sync to complete (~2 min)

# 5. Run staging validation tests
gh workflow run staging-validation.yml

# 6. Wait for tests to complete (~20-30 min)
gh run list --workflow=staging-validation.yml --limit 1

# 7. View test results
gh run view <run-id>
```

### Production Deployment
```bash
# 1. Get staging image tag
IMAGE_TAG=$(git rev-parse HEAD)

# 2. Trigger production deployment workflow
gh workflow run production-deployment.yml -f image_tag=$IMAGE_TAG

# 3. Wait for deployment PR to be created
gh pr list --label deployment

# 4. Review PR
gh pr view <pr-number>

# 5. Approve PR (requires team lead)
gh pr review <pr-number> --approve

# 6. Merge PR
gh pr merge <pr-number> --squash

# 7. Check Slack for ArgoCD sync notification

# 8. Login to ArgoCD and sync "ai-incident-prod"

# 9. Monitor deployment
kubectl get pods -n prod -w

# 10. Automated smoke tests run automatically
# 11. Check Slack for success/failure notification
```

---

## 🧪 Test Commands

### Run Tests Locally

#### E2E Tests (Staging)
```bash
cd tests
npm install
BASE_URL=http://staging.174.138.120.13.nip.io npm run test:e2e
```

#### Load Tests (Staging)
```bash
cd tests
BASE_URL=http://staging.174.138.120.13.nip.io k6 run load-tests/smoke-test.js
```

### View Test Results
```bash
# List recent test runs
gh run list --workflow=staging-validation.yml --limit 5

# View specific run
gh run view <run-id>

# Download test artifacts
gh run download <run-id>
```

---

## 🔍 Monitoring Commands

### Check Environment Health
```bash
# Dev
curl http://174.138.120.13/api/health

# Staging
curl http://staging.174.138.120.13.nip.io/api/health

# Production
curl http://prod.174.138.120.13.nip.io/api/health
```

### Check Pod Status
```bash
# Dev
kubectl get pods -n dev

# Staging
kubectl get pods -n staging

# Production
kubectl get pods -n prod
```

### View Logs
```bash
# Backend logs (last 100 lines)
kubectl logs -n <namespace> -l app.kubernetes.io/component=backend --tail=100

# Frontend logs
kubectl logs -n <namespace> -l app.kubernetes.io/component=frontend --tail=100

# Follow logs in real-time
kubectl logs -n <namespace> -l app.kubernetes.io/component=backend -f
```

### ArgoCD Status
```bash
# List all applications
kubectl get applications -n argocd

# Check specific application status
kubectl get application ai-incident-prod -n argocd -o yaml
```

---

## 🚨 Emergency Rollback

### Rollback Production
```bash
# 1. Identify previous working commit
git log --oneline infra/k8s/overlays/prod/kustomization.yaml

# 2. Revert to previous version
git revert <deployment-commit>
git push

# 3. Login to ArgoCD
# URL: http://209.38.124.183

# 4. Sync "ai-incident-prod" application

# 5. Verify rollback
curl http://prod.174.138.120.13.nip.io/api/health
kubectl get pods -n prod
```

### Emergency Pod Restart
```bash
# Restart specific deployment
kubectl rollout restart deployment backend -n prod
kubectl rollout restart deployment frontend -n prod

# Check rollout status
kubectl rollout status deployment backend -n prod
```

---

## 📊 Quick Checks

### Is CI Pipeline Running?
```bash
gh run list --workflow=ci-pipeline.yml --limit 5
```

### Did Staging Tests Pass?
```bash
gh run list --workflow=staging-validation.yml --limit 1 --json conclusion
```

### What Version is Running?
```bash
# Check image tags in K8s manifests
cat infra/k8s/overlays/prod/kustomization.yaml | grep "newTag"

# Check running pods
kubectl describe pod -n prod -l app.kubernetes.io/component=backend | grep Image:
```

### Are There Any Pending Deployment PRs?
```bash
gh pr list --label deployment --state open
```

---

## 🔗 Important URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Dev Environment | http://174.138.120.13 | - |
| Staging Environment | http://staging.174.138.120.13.nip.io | - |
| Production Environment | http://prod.174.138.120.13.nip.io | - |
| ArgoCD Dashboard | http://209.38.124.183 | admin / 9p6FXw9-mH8TdcNe |
| DigitalOcean Registry | registry.digitalocean.com/ai-incident-assistant | Token in secrets |
| GitHub Actions | https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions | - |

---

## 💡 Tips

1. **Always test in staging before production**
2. **Review deployment PRs carefully - they change production**
3. **Monitor Slack for deployment notifications**
4. **Check ArgoCD UI for visual deployment status**
5. **Keep rollback plan ready before production deployment**
6. **Run smoke tests after every production deployment**
7. **Document any manual changes in deployment PR**

---

## 📞 Need Help?

- Review full documentation: [docs/CICD_PIPELINE.md](CICD_PIPELINE.md)
- Check test results: `gh run list --workflow=staging-validation.yml`
- View logs: `kubectl logs -n <namespace> <pod-name>`
- ArgoCD UI: http://209.38.124.183
