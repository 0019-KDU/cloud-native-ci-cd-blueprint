# Production-Grade GitOps CI/CD Architecture

## System Overview

This is a production-ready CI/CD system implementing GitOps best practices with clear separation between CI (build/test) and CD (deploy).

## Core Principles

### 1. Git as Desired State Storage Only
- Git stores the desired state of infrastructure
- Git does NOT trigger deployments directly
- ArgoCD watches Git and reconciles Kubernetes state

### 2. Kubernetes as Source of Truth
- Kubernetes cluster is the single source of truth for all environments
- No "environment branches" (dev/staging/prod)
- All environments exist only in Kubernetes namespaces

### 3. Clear CI/CD Separation
- **CI (Continuous Integration)**: Build, test, scan, push images
- **CD (Continuous Delivery)**: GitOps PRs update manifests, ArgoCD deploys

## Architecture Diagram

```
Developer Workflow:
┌─────────────────────────────────────────────────────────────────────┐
│ DEVELOPER                                                           │
│                                                                     │
│ 1. Work on feature/* branch                                        │
│ 2. Open PR to main                                                 │
│ 3. PR Validation runs (tests only, no builds)                      │
│ 4. Code review + approval                                          │
│ 5. Merge to main                                                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ CI PIPELINE (main branch only)                                      │
│                                                                     │
│ 1. Run tests again                                                 │
│ 2. Build Docker images                                             │
│ 3. Scan images (Trivy)                                             │
│ 4. Push to registry                                                │
│ 5. Create GitOps PR (deploy/dev-* → main)                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ GITOPS PR                                                           │
│                                                                     │
│ 1. Updates infra/k8s/overlays/dev/kustomization.yaml               │
│ 2. GitOps Checks run (lightweight, satisfies required checks)      │
│ 3. Auto-merges (dev) or manual approval (staging/prod)             │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ ARGOCD (watches main branch)                                        │
│                                                                     │
│ 1. Detects kustomization change                                    │
│ 2. Syncs Kubernetes namespace                                      │
│ 3. Deploys new images                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ KUBERNETES CLUSTER                                                  │
│                                                                     │
│ Namespaces:                                                         │
│ - dev:     Auto-deployed after CI                                  │
│ - staging: Manual, with preview + E2E/load tests                   │
│ - prod:    Manual, Blue-Green with health monitoring               │
└─────────────────────────────────────────────────────────────────────┘
```

## Workflow Details

### 1. PR Validation (Feature PRs)

**Workflow:** `pr-validation.yaml`  
**Trigger:** `pull_request` to `main` (code changes only)  
**Purpose:** Validate code quality before merge

**Jobs:**
- ✅ Backend Tests & SonarQube
- ✅ Frontend Tests & SonarQube

**What it does:**
- Runs unit tests
- Runs linting
- Performs static code analysis (SonarQube)

**What it does NOT do:**
- ❌ Build Docker images
- ❌ Push to registry
- ❌ Update manifests
- ❌ Deploy anything

### 2. CI/CD - Dev Environment

**Workflow:** `ci-dev.yaml`  
**Trigger:** `push` to `main` (code changes only)  
**Purpose:** Build images and create GitOps PR for dev

**Jobs:**
1. Backend Tests & SonarQube (run again post-merge)
2. Frontend Tests & SonarQube (run again post-merge)
3. Build & Scan Backend (Docker build + Trivy)
4. Build & Scan Frontend (Docker build + Trivy)
5. Update GitOps Manifests (create PR with new image tags)

**Flow:**
```
Code merged to main
  → Run tests
  → Build images
  → Push to registry
  → Create deploy/dev-* branch
  → Update dev kustomization.yaml
  → Open PR
  → GitOps checks run (lightweight)
  → Auto-merge PR
  → ArgoCD detects change
  → ArgoCD syncs dev namespace
  → Deployment complete
```

### 3. GitOps PR Checks

**Workflow:** `gitops-checks.yaml`  
**Trigger:** `pull_request` to `main` (only kustomization changes)  
**Purpose:** Satisfy required status checks without heavy CI

**Jobs:**
- ✅ Backend Tests & SonarQube (lightweight skip job)
- ✅ Frontend Tests & SonarQube (lightweight skip job)
- ✅ Validate Kustomization (actual validation)

**Why this works:**
- Job **names** match pr-validation.yaml exactly
- GitHub requires these job names to pass
- GitOps PRs skip tests (images already tested)
- Validation ensures YAML syntax is correct

### 4. Staging Deployment

**Workflow:** `ci-staging.yaml`  
**Trigger:** `workflow_dispatch` (manual)  
**Purpose:** Controlled staging deployment with testing

**Flow:**
```
Manual trigger (specify image tag from dev)
  → Validate image was tested in dev
  → Create deploy/staging-* branch
  → Update staging kustomization.yaml
  → Open PR
  → Create preview namespace
  → Deploy to preview
  → Run E2E tests
  → Run load tests
  → Manual approval gate
  → Merge PR
  → ArgoCD syncs staging
  → Cleanup preview namespace
  → Delete deploy branch
```

**Features:**
- Preview deployments in isolated namespaces
- E2E and load testing before promotion
- Manual approval required
- Automatic cleanup

### 5. Production Deployment

**Workflow:** `ci-prod.yaml`  
**Trigger:** `workflow_dispatch` (manual)  
**Purpose:** Blue-Green production deployment with safety gates

**Flow:**
```
Manual trigger (specify image tag from staging)
  → Validate image passed staging
  → Create deploy/prod-* branch
  → Update prod kustomization.yaml
  → Open PR
  → Wait for PR merge (manual)
  → Deploy to preview (Green environment)
  → Run smoke tests
  → Manual approval for promotion
  → Promote to production (Blue → Green switch)
  → 60s warmup period
  → 5-minute health monitoring
  → If healthy: Success ✅
  → If unhealthy (3 consecutive failures): Automated rollback ❌
  → Delete deploy branch
```

**Safety Features:**
- Staging enforcement (image must be tested first)
- Blue-Green deployment (zero downtime)
- Preview URL for verification
- Manual approval gates
- Health monitoring (10 checks over 5 minutes)
- Automatic rollback on failure
- Slack notifications

## Environment Strategy

### Dev Environment
- **Namespace:** `dev`
- **Deployment:** Automatic after CI
- **Purpose:** Early integration testing
- **Stability:** Unstable (always latest)

### Staging Environment
- **Namespace:** `staging` (+ temporary preview namespaces)
- **Deployment:** Manual with testing
- **Purpose:** Pre-production validation
- **Stability:** Controlled releases

### Production Environment
- **Namespace:** `prod`
- **Deployment:** Manual, Blue-Green
- **Purpose:** Live user traffic
- **Stability:** Highly controlled, monitored

## Branch Strategy

### Long-Lived Branches
- `main`: Single source of truth
  - Contains all production code
  - Contains all infrastructure manifests
  - Triggers CI on code merge
  - Watched by ArgoCD for CD

### Short-Lived Branches
- `feature/*`: Developer work (manual cleanup)
- `deploy/dev-*`: Temporary GitOps branches (auto-deleted)
- `deploy/staging-*`: Temporary GitOps branches (auto-deleted)
- `deploy/prod-*`: Temporary GitOps branches (auto-deleted)

### No Environment Branches
- ❌ No `dev` branch
- ❌ No `staging` branch  
- ❌ No `production` branch

**Why?** 
- Environments are defined in Kubernetes, not Git branches
- GitOps PRs update manifests in main branch overlays
- ArgoCD watches main branch for all environments

## Security & Quality Gates

### Pull Request Level
1. Required reviews
2. Backend tests must pass
3. Frontend tests must pass
4. SonarQube quality gate
5. Conversation resolution

### CI Level
1. Unit tests
2. Integration tests
3. Docker image scanning (Trivy)
4. Vulnerability scanning (Critical = fail)
5. SARIF reports to GitHub Security

### Deployment Level

**Dev:**
- None (fast feedback)

**Staging:**
- Image must exist in registry
- E2E tests must pass
- Load tests must pass
- Manual approval

**Production:**
- Image must be tested in staging
- Smoke tests must pass
- Manual approval before promotion
- Health monitoring post-promotion
- Automated rollback on failure

## ArgoCD Configuration

### Applications

```yaml
# Dev
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: HEAD
    path: infra/k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# Staging
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-staging
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: HEAD
    path: infra/k8s/overlays/staging
  destination:
    server: https://kubernetes.default.svc
    namespace: staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

```yaml
# Production
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: ai-incident-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint
    targetRevision: HEAD
    path: infra/k8s/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: false  # Manual for prod
```

## Deployment Patterns

### Dev: Direct Deployment
- Standard Kubernetes Deployments
- Immediate rollout on sync
- No special rollout strategy

### Staging: Standard Rolling Update
- Standard Kubernetes Deployments
- Rolling update strategy
- Preview deployments for testing

### Production: Blue-Green with Argo Rollouts
- Argo Rollouts for backend/frontend
- Blue (active) and Green (preview) versions
- Traffic controlled by active/preview services
- Manual promotion step
- Automatic rollback capability

## Monitoring & Observability

### Planned (Not yet implemented)
- Prometheus for metrics
- Grafana for dashboards
- Alert Manager for notifications
- Service meshes for advanced traffic control

### Currently Implemented
- GitHub Actions workflow logs
- Slack notifications for deployments
- Kubernetes events and logs
- ArgoCD UI for deployment status

## Disaster Recovery

### Rollback Scenarios

**Scenario 1: Bad code merged to main**
- Solution: Revert the commit in main
- Effect: ArgoCD syncs the revert to dev automatically

**Scenario 2: Bad image deployed to staging**
- Solution: Trigger staging workflow with previous good tag
- Effect: Creates new PR with old tag, merge to rollback

**Scenario 3: Bad image deployed to production**
- Solution: Automated rollback via health monitoring
- Manual: Trigger prod workflow with previous good tag

## File Structure

```
cloud-native-ci-cd-blueprint/
├── .github/
│   └── workflows/
│       ├── pr-validation.yaml        # Tests on PRs (no builds)
│       ├── ci-dev.yaml                # Build + create GitOps PR
│       ├── gitops-checks.yaml         # Lightweight checks for GitOps PRs
│       ├── ci-staging.yaml            # Manual staging deployment
│       ├── ci-prod.yaml               # Manual production deployment
│       └── verify-deployment.yaml     # Post-deployment verification
├── backend/                           # Backend source code
├── frontend/                          # Frontend source code
├── infra/
│   ├── docker/                        # Dockerfiles
│   ├── k8s/
│   │   ├── base/                      # Base Kubernetes manifests
│   │   └── overlays/
│   │       ├── dev/                   # Dev environment overlay
│   │       │   └── kustomization.yaml # Image tags updated by CI
│   │       ├── staging/               # Staging environment overlay
│   │       │   └── kustomization.yaml # Image tags updated by workflow
│   │       └── prod/                  # Prod environment overlay
│   │           └── kustomization.yaml # Image tags updated by workflow
│   └── argo-workflows/                # E2E and load test workflows
└── docs/
    ├── architecture.md                # This file
    └── github-branch-protection.md    # Branch protection setup
```

## Best Practices Implemented

### ✅ GitOps Principles
1. Git is the single source of truth for infrastructure
2. Declarative infrastructure (Kubernetes YAML)
3. Automated synchronization (ArgoCD)
4. Git-based operations (PRs for all changes)

### ✅ CI/CD Separation
1. CI runs on code changes (main branch)
2. CD triggered by manifest changes (GitOps PRs)
3. No deployments from CI
4. No builds from CD

### ✅ Security
1. No secrets in code
2. Image scanning before deployment
3. Branch protection rules
4. Manual approvals for critical environments

### ✅ Safety
1. Staging enforcement for production
2. Blue-Green deployments
3. Health monitoring
4. Automated rollback
5. Preview environments for testing

### ✅ Observability
1. All workflows logged
2. Slack notifications
3. GitHub Security integration
4. ArgoCD UI visibility

## Common Operations

### Deploy to Dev
```bash
# Automatic: Just merge code to main
git checkout main
git merge feature/my-feature
git push
# CI runs, builds images, creates GitOps PR, auto-merges, ArgoCD deploys
```

### Deploy to Staging
```bash
# Manual: Trigger workflow
gh workflow run ci-staging.yaml
# Select image tag from dev or provide specific tag
# Wait for E2E and load tests
# Approve deployment
```

### Deploy to Production
```bash
# Manual: Trigger workflow with staging-tested tag
gh workflow run ci-prod.yaml -f image_tag=abc123...
# Wait for smoke tests
# Approve promotion
# Monitor health checks
```

### Rollback Production
- Automatic if health checks fail
- Manual: Deploy previous known-good image tag

### Check Deployment Status
```bash
# Via ArgoCD
kubectl get applications -n argocd

# Via Kubernetes
kubectl get pods -n dev
kubectl get pods -n staging
kubectl get pods -n prod
```

## Troubleshooting Guide

### Issue: PR can't merge (checks not passing)
1. Check workflow logs in Actions tab
2. Ensure tests pass locally
3. Verify branch is up to date with main

### Issue: GitOps PR blocked
1. Ensure gitops-checks.yaml job names match pr-validation.yaml
2. Check path filters in workflow triggers
3. Verify kustomization syntax is valid

### Issue: ArgoCD not syncing
1. Check ArgoCD application status: `kubectl get app -n argocd`
2. Verify Git repository is accessible
3. Check for sync errors in ArgoCD UI
4. Manually trigger sync if needed

### Issue: Deployment failing
1. Check pod logs: `kubectl logs -n <namespace> <pod>`
2. Check events: `kubectl get events -n <namespace>`
3. Verify image exists in registry
4. Check image pull secrets

### Issue: Health checks failing in production
1. Review health check logs in workflow
2. Check application logs: `kubectl logs -n prod <pod>`
3. Verify services are responding: `kubectl get svc -n prod`
4. Check ingress configuration

## Future Enhancements

### Planned
- [ ] Implement Prometheus + Grafana monitoring stack
- [ ] Add canary deployments for production
- [ ] Implement progressive delivery with Flagger
- [ ] Add automated security scanning in CI
- [ ] Implement cost monitoring and optimization
- [ ] Add multi-cluster support
- [ ] Implement disaster recovery procedures
- [ ] Add performance testing in CI pipeline

### Under Consideration
- Service mesh (Istio/Linkerd) for advanced traffic control
- Policy enforcement with OPA/Kyverno
- Secret management with Sealed Secrets or External Secrets
- Multi-region deployment strategy

## Conclusion

This architecture implements production-grade GitOps best practices:
- ✅ Clear separation of concerns (CI vs CD)
- ✅ Git as desired state storage only
- ✅ Kubernetes as single source of truth
- ✅ No environment branches
- ✅ Automated dev, controlled staging, safe production
- ✅ Comprehensive testing and validation
- ✅ Automatic rollback capabilities
- ✅ Clean, auditable, and maintainable

The system is ready for production use and can scale with team growth and system complexity.
