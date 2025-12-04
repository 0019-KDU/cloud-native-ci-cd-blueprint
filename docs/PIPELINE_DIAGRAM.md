# CI/CD Pipeline Architecture Diagram

## 🏗️ Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

Developer → Feature Branch → Open PR → Code Review → Merge
                              │
                              ├─→ PR to dev       (Limited CI)
                              ├─→ PR to staging   (Limited CI)
                              └─→ PR to main      (Limited CI)

┌─────────────────────────────────────────────────────────────────────────────┐
│                            BUILD STAGE (Blue)                                │
│                          "Build Once, Deploy Many"                           │
└─────────────────────────────────────────────────────────────────────────────┘

Push to Branch
    │
    ├─→ dev branch
    │   └─→ Build Image: dev-abc1234-20251203-120000
    │       Tags: dev-latest
    │
    ├─→ staging branch
    │   └─→ Build Image: staging-xyz5678-20251203-140000
    │       Tags: staging-latest
    │
    └─→ main branch
        └─→ Build Image: prod-mno9012-20251203-160000
            Tags: prod-latest

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEV STAGE (Green) - Auto                             │
└─────────────────────────────────────────────────────────────────────────────┘

Merge to dev → CI Pipeline
    │
    ├─→ 🔍 Secret Scan (Gitleaks)
    ├─→ 🧪 Unit Tests + Integration Tests
    ├─→ 📊 SonarQube Analysis
    ├─→ 🐳 Build Docker Image (dev-*)
    ├─→ 🛡️ Trivy Security Scan
    ├─→ 📦 Push to Registry
    └─→ 🚀 Auto-Deploy to Dev Cluster
        │
        └─→ Update GitOps (Kustomize)
            └─→ ArgoCD/Flux Sync
                └─→ Kubernetes Apply
                    └─→ Health Checks
                        └─→ ✅ Live at dev.yourdomain.com

┌─────────────────────────────────────────────────────────────────────────────┐
│                      QA/STAGING STAGE (Green) - Auto                         │
└─────────────────────────────────────────────────────────────────────────────┘

Merge to staging → CI Pipeline
    │
    ├─→ 🔍 Secret Scan
    ├─→ 🧪 Unit Tests
    ├─→ 📊 SonarQube Analysis
    ├─→ 🐳 Build Docker Image (staging-*)
    ├─→ 🛡️ Trivy Security Scan
    ├─→ 📦 Push to Registry
    └─→ 🎯 Auto-Deploy to Staging Cluster
        │
        ├─→ Update GitOps
        ├─→ ArgoCD/Flux Sync
        ├─→ Kubernetes Apply
        ├─→ Health Checks
        │
        └─→ 🧪 Run Integration Tests
            ├─→ Selenium Functional Tests
            ├─→ API Integration Tests
            ├─→ Chaos Engineering Tests
            └─→ E2E Tests
                └─→ ✅ Quality Gate Passed
                    └─→ ✅ Live at staging.yourdomain.com

┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION STAGE (Green) - Manual Approval                │
└─────────────────────────────────────────────────────────────────────────────┘

Merge to main → CI Pipeline
    │
    ├─→ 🔍 Secret Scan
    ├─→ 🧪 All Tests
    ├─→ 📊 SonarQube Analysis
    ├─→ 🐳 Build Docker Image (prod-*)
    ├─→ 🛡️ Trivy Security Scan
    ├─→ 📦 Push to Registry
    │
    └─→ ⏸️  WAIT FOR APPROVAL
        │   (GitHub Environment Protection)
        │   Reviewers: DevOps Lead, Platform Engineer
        │
        └─→ ✅ APPROVED
            │
            └─→ 🏭 Deploy to Production
                ├─→ Update GitOps (infra/k8s/overlays/production)
                ├─→ Kubernetes Apply
                ├─→ Health Checks (30s)
                └─→ ✅ Traffic Active
                    └─→ 🎉 Production Deployment Complete
                        └─→ ✅ Live at yourdomain.com

┌─────────────────────────────────────────────────────────────────────────────┐
│                      OBSERVABILITY & MONITORING                              │
│                     (Continuous Verification)                                │
└─────────────────────────────────────────────────────────────────────────────┘

All Environments
    ├─→ 📊 Prometheus Metrics
    ├─→ 📈 Grafana Dashboards
    ├─→ 📝 Centralized Logging (ELK/Loki)
    ├─→ 🚨 Alerting (PagerDuty/Slack)
    ├─→ 🔍 Tracing (Jaeger/Zipkin)
    └─→ 💚 Synthetic Monitoring (Uptime checks)
```

## 📊 Pipeline Stages Comparison

| Stage | PR Check | Dev Deploy | Staging Deploy | Prod Deploy |
|-------|----------|------------|----------------|-------------|
| **Trigger** | PR opened | Push to dev | Push to staging | Push to main |
| **Duration** | ~3-5 min | ~8-10 min | ~15-20 min | ~30-40 min |
| **Secret Scan** | ✅ | ✅ | ✅ | ✅ |
| **Lint & Test** | ✅ | ✅ | ✅ | ✅ |
| **SonarQube** | ✅ | ✅ | ✅ | ✅ |
| **Docker Build** | ❌ | ✅ | ✅ | ✅ |
| **Security Scan** | ❌ | ✅ | ✅ | ✅ |
| **Push Registry** | ❌ | ✅ | ✅ | ✅ |
| **Deploy** | ❌ | ✅ Auto | ✅ Auto | ✅ Manual |
| **Integration Tests** | ❌ | ❌ | ✅ | ❌ |
| **E2E Tests** | ❌ | ❌ | ✅ | ❌ |
| **Approval Required** | ❌ | ❌ | ❌ | ✅ Yes (2) |
| **Regions** | - | Single | Single | Multi (3) |

## 🔄 GitOps Sync Flow

```
GitHub Repo (infra/k8s/)
    │
    ├─→ dev branch
    │   └─→ overlays/dev/kustomization.yaml
    │       └─→ image: backend:dev-latest
    │           └─→ ArgoCD watches dev branch
    │               └─→ Syncs to Dev Cluster
    │
    ├─→ staging branch
    │   └─→ overlays/staging/kustomization.yaml
    │       └─→ image: backend:staging-latest
    │           └─→ ArgoCD watches staging branch
    │               └─→ Syncs to Staging Cluster
    │
    └─→ main branch
        └─→ overlays/production/kustomization.yaml
            └─→ image: backend:prod-latest
                └─→ ArgoCD watches main branch
                    └─→ Syncs to Production Cluster
```

## 🏷️ Image Tagging Strategy

```
registry.digitalocean.com/ai-incident-assistant/backend

├─→ dev-abc1234-20251203-120000     (Versioned tag)
├─→ dev-latest                       (Latest dev)
│
├─→ staging-xyz5678-20251203-140000 (Versioned tag)
├─→ staging-latest                   (Latest staging)
│
├─→ prod-mno9012-20251203-160000    (Versioned tag)
└─→ prod-latest                      (Latest prod)

Format: {env}-{short-sha}-{timestamp}
Example: dev-a1b2c3d-20251203-143052
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│   Layer 1: Secret Scanning (Gitleaks)   │
│   - Scan commits for exposed secrets    │
│   - Block push if secrets found         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│   Layer 2: Code Quality (SonarQube)     │
│   - Static code analysis                │
│   - Security hotspots                   │
│   - Code smell detection                │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│   Layer 3: Image Scanning (Trivy)       │
│   - OS package vulnerabilities          │
│   - CVE detection                       │
│   - SARIF upload to GitHub Security     │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│   Layer 4: Runtime Security              │
│   - Kubernetes RBAC                     │
│   - Network policies                    │
│   - Pod security standards              │
└─────────────────────────────────────────┘
```

## 📈 Deployment Metrics

```
DORA Metrics Tracking:

├─→ Deployment Frequency
│   Target: 10+ deploys/day to dev
│   Target: 2-5 deploys/day to staging
│   Target: 2-5 deploys/week to production
│
├─→ Lead Time for Changes
│   Target: < 1 hour (commit to production)
│   Current path: dev (10m) → staging (20m) → prod (30m)
│
├─→ Change Failure Rate
│   Target: < 15%
│   Tracked via: Rollbacks, hotfixes
│
└─→ Mean Time to Recovery (MTTR)
    Target: < 1 hour
    Enabled by: Automated rollbacks, health checks
```

## 🎯 Quality Gates

```
Pull Request Gates:
├─→ ✅ All tests pass (60/60)
├─→ ✅ Code coverage > 50%
├─→ ✅ No linting errors
├─→ ✅ SonarQube quality gate pass
└─→ ✅ 1+ approving review

Staging Gates:
├─→ ✅ All unit tests pass
├─→ ✅ Integration tests pass
├─→ ✅ E2E tests pass (Selenium)
├─→ ✅ API tests pass
├─→ ✅ No CRITICAL vulnerabilities
└─→ ✅ Performance benchmarks met

Production Gates:
├─→ ✅ Successful staging deployment
├─→ ✅ Manual approval from 2 reviewers
├─→ ✅ No active incidents
├─→ ✅ Change management ticket
└─→ ✅ Rollback plan documented
```

---

## 🚀 Quick Reference Commands

### View Pipeline Status
```bash
# Check GitHub Actions
gh workflow list
gh run list --workflow=backend-pipeline.yml

# Watch current run
gh run watch
```

### Manual Deployment
```bash
# Deploy specific version to staging
kubectl set image deployment/backend \
  backend=registry.digitalocean.com/ai-incident-assistant/backend:staging-abc1234 \
  -n staging

# Rollback
kubectl rollout undo deployment/backend -n production
```

### Check Environment Status
```bash
# Dev
kubectl get pods -n dev
kubectl logs -f deployment/backend -n dev

# Staging
kubectl get pods -n staging
kubectl logs -f deployment/backend -n staging

# Production
kubectl get pods -n production
kubectl logs -f deployment/backend -n production
```

---

**Architecture Version**: 2.0 (GitOps Multi-Stage)  
**Last Updated**: December 3, 2025
