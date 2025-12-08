# Modern GitOps CI/CD Pipeline

This document describes the redesigned CI/CD pipeline following GitOps best practices with "Build Once, Deploy Many" strategy.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Workflow                            │
│  git push main → GitHub Actions → Build & Test → Push Image     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Single Container Image                        │
│  registry.digitalocean.com/ai-incident-assistant:sha-abc123     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GitOps Repository Update                        │
│  Update image tags in: dev, staging, prod overlays              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ArgoCD Deployments                          │
│  Dev: Auto-sync ✅  │  Staging: Manual 🟡  │  Prod: Manual 🟡  │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Repository Structure

### Application Repository (cloud-native-ci-cd-blueprint)
```
cloud-native-ci-cd-blueprint/
├── .github/workflows/
│   └── ci-pipeline.yml          # Single unified pipeline
├── backend/                     # Backend application code
├── frontend/                    # Frontend application code
├── tests/                       # E2E and load tests
└── infra/docker/               # Dockerfiles
```

### GitOps Repository (cloud-native-infrastructure)
```
cloud-native-infrastructure/
├── k8s/
│   ├── base/                   # Base Kubernetes manifests
│   │   ├── kustomization.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── frontend-deployment.yaml
│   │   ├── postgres-deployment.yaml
│   │   └── services.yaml
│   └── overlays/              # Environment-specific configs
│       ├── dev/
│       │   ├── kustomization.yaml    # Image tags updated by CI
│       │   ├── namespace.yaml
│       │   ├── ingress.yaml
│       │   └── patch-replicas.yaml
│       ├── staging/
│       │   ├── kustomization.yaml    # Image tags updated by CI
│       │   ├── namespace.yaml
│       │   ├── ingress.yaml
│       │   └── patch-replicas.yaml
│       └── prod/
│           ├── kustomization.yaml    # Image tags updated by CI
│           ├── namespace.yaml
│           ├── ingress.yaml
│           ├── patch-replicas.yaml
│           └── patch-resources.yaml
├── argocd/
│   ├── dev-app.yaml          # Auto-sync enabled
│   ├── staging-app.yaml      # Manual sync required
│   └── prod-app.yaml         # Manual sync required
└── terraform/                # Cluster provisioning
```

## 🚀 CI/CD Pipeline Flow

### 1. Code Push to Main Branch
```bash
git push origin main
```

### 2. GitHub Actions Pipeline Execution

#### Stage 1: Test & Quality Gates
- **Backend Tests**: Unit tests, linting
- **Frontend Tests**: Build validation, linting
- **SonarQube Scan**: Code quality analysis
- **Security Scan**: Trivy container vulnerability scan

#### Stage 2: Build Single Image
```yaml
# Single image tagged with git SHA
registry.digitalocean.com/ai-incident-assistant/backend:abc123def
registry.digitalocean.com/ai-incident-assistant/frontend:abc123def
```

#### Stage 3: Update GitOps Repository
The pipeline automatically updates image tags in ALL environments:
```bash
# k8s/overlays/dev/kustomization.yaml
kustomize edit set image backend=...backend:abc123def

# k8s/overlays/staging/kustomization.yaml
kustomize edit set image backend=...backend:abc123def

# k8s/overlays/prod/kustomization.yaml
kustomize edit set image backend=...backend:abc123def
```

### 3. ArgoCD Automatic Deployment

- **Dev**: Automatically syncs and deploys ✅
- **Staging**: Waits for manual approval 🟡
- **Production**: Waits for manual approval 🟡

## 🎯 Deployment Workflow

### Development Deployment (Automatic)
```bash
# Triggered automatically after CI completes
# ArgoCD detects changes and syncs immediately
```

### Staging Deployment (Manual)
```bash
# 1. Verify dev deployment
kubectl get pods -n dev

# 2. Check ArgoCD for staging changes
# 3. Click "SYNC" button in ArgoCD UI or:
argocd app sync ai-incident-assistant-staging

# 4. Run E2E tests against staging
npm run test:e2e:staging
```

### Production Deployment (Manual)
```bash
# 1. Verify staging deployment success
kubectl get pods -n staging

# 2. Run smoke tests
npm run test:smoke:staging

# 3. Click "SYNC" button in ArgoCD UI or:
argocd app sync ai-incident-assistant-prod

# 4. Monitor production metrics
```

## 🔧 Environment Configuration

### Dev Environment
- **Replicas**: 1 per service
- **Resources**: Minimal (200m CPU, 256Mi RAM)
- **Sync**: Automatic
- **Purpose**: Rapid development iteration

### Staging Environment
- **Replicas**: 2 per service (except postgres: 1)
- **Resources**: Standard (200m CPU, 256Mi RAM)
- **Sync**: Manual approval required
- **Purpose**: Pre-production testing, E2E tests

### Production Environment
- **Replicas**: 3 per service (except postgres: 1)
- **Resources**: High (500m-1000m CPU, 512Mi-1Gi RAM)
- **Sync**: Manual approval required
- **Purpose**: Live production traffic

## 📝 Required Secrets

### GitHub Repository Secrets (Application Repo)
```bash
DIGITALOCEAN_ACCESS_TOKEN    # DigitalOcean API token
SONAR_TOKEN                   # SonarQube authentication
SONAR_HOST_URL                # SonarQube server URL
GITOPS_PAT                    # GitHub PAT for GitOps repo updates
```

### Kubernetes Secrets (Per Environment)
```bash
# PostgreSQL credentials
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=<password> \
  --from-literal=POSTGRES_DB=incidents \
  -n <namespace>

# Backend application secrets
kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY=<your-openai-key> \
  -n <namespace>

# Container registry access (auto-created by DO)
# Secret name: ai-incident-assistant
```

## 🎨 Key Benefits

### 1. Build Once, Deploy Many
- ✅ Same container image across all environments
- ✅ No environment-specific builds
- ✅ Guaranteed consistency

### 2. GitOps Driven
- ✅ Git as single source of truth
- ✅ Declarative infrastructure
- ✅ Full audit trail in git history

### 3. Progressive Delivery
- ✅ Auto-deploy to dev for fast feedback
- ✅ Manual gates for staging/prod
- ✅ Easy rollback via git revert

### 4. Security First
- ✅ SonarQube code quality scanning
- ✅ Trivy container vulnerability scanning
- ✅ Secrets never in git
- ✅ Immutable image tags (SHA-based)

## 🔄 Rollback Procedure

### Quick Rollback (Git Revert)
```bash
# 1. Find the previous working commit
cd cloud-native-infrastructure
git log --oneline k8s/overlays/prod/kustomization.yaml

# 2. Revert to previous version
git revert <commit-sha>
git push origin main

# 3. ArgoCD will detect and sync the rollback
# Or manually sync in ArgoCD UI
```

### Emergency Rollback (kubectl)
```bash
# Rollback deployment to previous revision
kubectl rollout undo deployment/backend -n prod
kubectl rollout undo deployment/frontend -n prod

# Check rollout status
kubectl rollout status deployment/backend -n prod
```

## 📊 Monitoring Deployments

### Check Pipeline Status
```bash
# GitHub Actions dashboard
https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions

# View specific workflow run
gh run view <run-id>
```

### Check ArgoCD Status
```bash
# ArgoCD UI
https://<argocd-url>

# CLI
argocd app get ai-incident-assistant-dev
argocd app get ai-incident-assistant-staging
argocd app get ai-incident-assistant-prod
```

### Check Kubernetes Status
```bash
# Pods status
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod

# Deployment history
kubectl rollout history deployment/backend -n prod

# Resource usage
kubectl top pods -n prod
```

## 🧪 Testing Strategy

### Automated Tests (CI Pipeline)
- ✅ Unit tests (60 tests)
- ✅ Linting (ESLint)
- ✅ Code quality (SonarQube)
- ✅ Container scanning (Trivy)

### Manual Tests (Post-Deployment)
- 🟡 E2E tests against staging
- 🟡 Load tests with K6
- 🟡 Smoke tests in production
- 🟡 Manual QA testing

## 📚 Additional Resources

- [Kustomize Documentation](https://kustomize.io/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [GitOps Principles](https://opengitops.dev/)
- [DigitalOcean Kubernetes](https://docs.digitalocean.com/products/kubernetes/)

## 🆘 Troubleshooting

### Pipeline Fails to Update GitOps Repo
```bash
# Check GitHub PAT permissions
# Required scopes: repo, workflow

# Verify GITOPS_PAT secret is set
gh secret list --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

### ArgoCD Not Syncing
```bash
# Check ArgoCD application health
kubectl get application -n argocd

# View application details
argocd app get ai-incident-assistant-dev

# Force refresh
argocd app get ai-incident-assistant-dev --refresh
```

### Image Pull Errors
```bash
# Verify registry secret exists
kubectl get secret ai-incident-assistant -n <namespace>

# Recreate if needed
doctl registry kubernetes-manifest | kubectl apply -f -
```

## 📞 Support

- **Application Issues**: [cloud-native-ci-cd-blueprint/issues](https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/issues)
- **Infrastructure Issues**: [cloud-native-infrastructure/issues](https://github.com/0019-KDU/cloud-native-infrastructure/issues)
