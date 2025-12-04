# GitOps Multi-Stage CI/CD Architecture

## 🏗️ Architecture Overview

This project implements a **production-grade GitOps CI/CD pipeline** with progressive deployment across multiple environments (single-region).

```
Developer → Feature Branch → PR → dev → staging → main
                              ↓       ↓          ↓
                          Test Only  Full CI   Full CI
                                      ↓          ↓
                                    Dev Env  Staging  Production
                                            (Auto)   (Approval)
                                                        Single Region
```

## 🎯 Key Principles

### 1. **Build Once, Deploy Many**
- Docker images built only once per commit
- Same immutable artifact promoted through environments
- Tagged with environment prefix: `dev-*`, `staging-*`, `prod-*`

### 2. **Progressive Deployment**
- **Dev**: Automatic deployment on merge
- **Staging**: Automatic deployment + integration tests
- **Production**: Manual approval + production deployment

### 3. **Separation of Concerns**
- **PR**: Fast feedback (lint, test, code quality only)
- **Push to dev**: Full pipeline (build, scan, push, deploy)
- **Push to staging**: Full pipeline + E2E tests
- **Push to main**: Full pipeline + approval + production deploy

## 📊 Pipeline Stages

### Stage 1: Pull Request Checks (Fast Feedback)
**Triggers**: PR to `dev`, `staging`, or `main`
**Duration**: ~3-5 minutes

```yaml
Jobs:
  ✓ Secret Scanning (Gitleaks)
  ✓ Lint & Unit Tests  
  ✓ Code Quality (SonarQube)
  ✗ Build (skipped - saves resources)
  ✗ Security Scan (skipped)
  ✗ Push (skipped)
  ✗ Deploy (skipped)
```

### Stage 2: Build Stage (Build Once)
**Triggers**: Push to `dev`, `staging`, or `main`
**Duration**: ~5-8 minutes

```yaml
Jobs:
  ✓ Secret Scanning
  ✓ Test & Quality
  ✓ Build Docker Image (with environment tag)
  ✓ Security Scan (Trivy)
  ✓ Push to Registry
```

**Image Tagging Strategy**:
```
dev-abc1234-20251203-120000
dev-latest

staging-xyz5678-20251203-140000
staging-latest

prod-mno9012-20251203-160000
prod-latest
```

### Stage 3: Dev Environment (Auto-Deploy)
**Triggers**: Automatic on push to `dev` branch
**Duration**: ~2-3 minutes

```yaml
Environment: development
URL: https://dev.yourdomain.com
Approval: None (auto-deploy)

Steps:
  1. Load image from registry (dev-latest)
  2. Update GitOps manifest (Kustomize)
  3. ArgoCD/Flux syncs automatically
  4. Health checks
```

### Stage 4: Staging Environment (Auto-Deploy + Tests)
**Triggers**: Automatic on push to `staging` branch
**Duration**: ~10-15 minutes

```yaml
Environment: staging (QA)
URL: https://staging.yourdomain.com
Approval: None (auto-deploy)

Steps:
  1. Load image from registry (staging-latest)
  2. Update GitOps manifest
  3. Deploy to staging cluster
  4. Run integration tests
  5. Run E2E tests (Selenium/Playwright)
  6. Run chaos engineering tests (optional)
  7. Health checks
```

**Quality Gates**:
- ✅ All unit tests pass
- ✅ Code coverage > 50%
- ✅ SonarQube quality gate pass
- ✅ No CRITICAL vulnerabilities
- ✅ Integration tests pass
- ✅ E2E tests pass

### Stage 5: Production Environment (Manual Approval)
**Triggers**: Manual approval after push to `main` branch
**Duration**: ~10-15 minutes

```yaml
Environment: production
URL: https://yourdomain.com
Approval: Required (GitHub Environments)

Deployment:
  1. Deploy to Production Cluster
     - Update GitOps manifest
     - ArgoCD/Flux sync
     - Health check (30s)
     - Traffic validation

Deployment Strategy: Rolling Update / Blue-Green
```

## 🚀 Branch Strategy

```
main (protected)
  ├─ Production environment
  ├─ Requires: PR approval, passing tests
  └─ Manual deployment approval

staging (protected)
  ├─ QA/Staging environment
  ├─ Requires: PR approval
  └─ Auto-deploys on merge

dev (protected)
  ├─ Development environment
  ├─ Requires: PR approval
  └─ Auto-deploys on merge

feature/* (developer branches)
  └─ PR to dev → limited CI checks
```

## 🔐 Environment Protection Rules

### Development
- Auto-deploy: ✅ Yes
- Approval required: ❌ No
- Branch protection: ✅ Yes (require PR)

### Staging
- Auto-deploy: ✅ Yes (after tests)
- Approval required: ❌ No
- Branch protection: ✅ Yes (require PR + status checks)
- Quality gates: ✅ Integration tests must pass

### Production
- Auto-deploy: ❌ No
- Approval required: ✅ Yes (1+ reviewers)
- Branch protection: ✅ Yes (require PR + 2 reviewers)
- Deployment strategy: Blue-Green with manual promotion

## 📦 Image Management

### Registry Structure
```
registry.digitalocean.com/ai-incident-assistant/
├── backend:dev-latest
├── backend:dev-abc1234-20251203-120000
├── backend:staging-latest
├── backend:staging-xyz5678-20251203-140000
├── backend:prod-latest
├── backend:prod-mno9012-20251203-160000
├── frontend:dev-latest
└── ... (same for frontend)
```

### Image Retention
- **dev-***: 7 days
- **staging-***: 30 days  
- **prod-***: 90 days
- **-latest tags**: Always kept

## 🛠️ GitOps Deployment

### Kustomize Structure
```
infra/k8s/
├── base/
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml (1 replica, dev-latest)
    ├── staging/
    │   └── kustomization.yaml (2 replicas, staging-latest)
    └── production/
        └── kustomization.yaml (3 replicas, prod-latest)
```

### ArgoCD Application Example
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-dev
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
```

## 🔄 Workflow Examples

### Example 1: Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/add-analytics dev

# 2. Make changes, commit
git commit -m "feat: add analytics dashboard"

# 3. Push and create PR to dev
git push origin feature/add-analytics

# 4. GitHub Actions runs PR checks:
#    - Secret scan
#    - Lint & test
#    - SonarQube
#    (No Docker build on PR)

# 5. Merge PR to dev
#    → Full CI pipeline runs
#    → Docker image built: dev-abc1234-20251203-120000
#    → Auto-deploys to dev environment

# 6. Test on dev.yourdomain.com

# 7. Create PR: dev → staging
#    → Full CI pipeline runs
#    → Docker image built: staging-xyz5678-20251203-140000
#    → Auto-deploys to staging
#    → Integration tests run

# 8. Create PR: staging → main
#    → Full CI pipeline runs
#    → Docker image built: prod-mno9012-20251203-160000
#    → Waits for manual approval
#    → Deploy to prod regions (East, West, EU)
```

### Example 2: Hotfix
```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-bug main

# 2. Fix bug, commit
git commit -m "fix: resolve critical security issue"

# 3. Push and create PR to main
git push origin hotfix/critical-bug

# 4. PR checks pass

# 5. Merge to main
#    → Full CI pipeline
#    → Manual approval required
#    → Deploy to production

# 6. Cherry-pick to staging and dev
git checkout staging
git cherry-pick <commit-sha>
git push origin staging
```

## 📈 Monitoring & Observability

### Pipeline Metrics
- Build time per stage
- Deployment frequency
- Lead time for changes
- Change failure rate
- Mean time to recovery (MTTR)

### Application Metrics
- Request rate, error rate, duration (RED)
- CPU, memory, disk usage
- Database query performance
- API endpoint latency

### Continuous Verification
- Prometheus + Grafana dashboards
- Health check endpoints
- Synthetic monitoring (Pingdom/Uptime Robot)
- Log aggregation (ELK/Loki)

## 🎓 Best Practices

1. **Never commit secrets** - Use GitHub Secrets or external vaults
2. **Test before merge** - All tests must pass in PR
3. **Small, frequent deployments** - Deploy to dev multiple times per day
4. **Monitor everything** - Set up alerts for failures
5. **Rollback ready** - Keep previous images for quick rollback
6. **Document changes** - Update this doc when modifying pipeline

## 🔗 Related Documentation

- [Pipeline Setup Guide](./SETUP_GUIDE.md)
- [Secrets Configuration](./.github/SECRETS_SETUP.md)
- [API Documentation](./api-spec.md)
- [Architecture Decisions](./architecture.md)

## 🆘 Troubleshooting

### Pipeline Fails on PR
- Check PR checks tab for error details
- Most common: lint errors, test failures, SonarQube quality gate

### Build Stage Fails
- Docker build errors: Check Dockerfile syntax
- npm install fails: Verify package.json/package-lock.json sync
- Image tag errors: Check metadata extraction step

### Deployment Fails
- Image not found: Verify registry push completed
- Pod crashes: Check logs with `kubectl logs -n <namespace> <pod-name>`
- Health check fails: Verify application starts correctly

### Rollback Procedure
```bash
# 1. Find previous working image
docker pull registry.digitalocean.com/ai-incident-assistant/backend:prod-<previous-sha>

# 2. Update Kustomize to use previous tag
cd infra/k8s/overlays/production
kustomize edit set image backend=registry.digitalocean.com/ai-incident-assistant/backend:prod-<previous-sha>

# 3. Commit and push
git commit -m "rollback: revert to previous version"
git push

# 4. ArgoCD syncs automatically
```

## 📞 Support

For questions or issues with the CI/CD pipeline:
1. Check this documentation
2. Review GitHub Actions logs
3. Check ArgoCD/Flux dashboard
4. Contact DevOps team

---

**Last Updated**: December 3, 2025  
**Architecture Version**: 2.0 (GitOps Multi-Stage)
