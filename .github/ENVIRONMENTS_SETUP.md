# GitHub Environments Configuration

Configure GitHub Environments to enable deployment gates, approvals, and environment-specific secrets.

## 🎯 Overview

Environments provide deployment protection rules and allow you to:
- Require manual approval before deployment
- Restrict which branches can deploy
- Set environment-specific secrets and variables
- Track deployment history

## 🛠️ Setup Instructions

### 1. Navigate to Repository Settings

```
GitHub Repo → Settings → Environments → New Environment
```

### 2. Create Development Environment

**Name**: `development`

**Protection Rules**:
- ❌ Required reviewers: None (auto-deploy)
- ✅ Wait timer: 0 minutes
- ✅ Deployment branches: `dev` only

**Environment Secrets**:
```
VITE_API_URL=https://dev-backend.yourdomain.com
```

**Environment Variables**:
```
ENVIRONMENT_NAME=development
CLUSTER_NAME=dev-cluster
```

### 3. Create Staging Environment

**Name**: `staging`

**Protection Rules**:
- ❌ Required reviewers: None (auto-deploy after tests)
- ✅ Wait timer: 0 minutes
- ✅ Deployment branches: `staging` only

**Environment Secrets**:
```
VITE_API_URL=https://staging-backend.yourdomain.com
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=https://...@sentry.io/...
```

**Environment Variables**:
```
ENVIRONMENT_NAME=staging
CLUSTER_NAME=staging-cluster
RUN_E2E_TESTS=true
```

### 4. Create Production Environment

**Name**: `production`

**Protection Rules**:
- ✅ Required reviewers: 1-2 reviewers
  - Select: DevOps team members
- ✅ Wait timer: 0 minutes (optional: 10 minutes for observation window)
- ✅ Deployment branches: `main` only
- ✅ Prevent self-review: Yes

**Environment Secrets**:
```
VITE_API_URL=https://backend.yourdomain.com
DO_REGISTRY=registry.digitalocean.com/ai-incident-assistant
DATADOG_API_KEY=your-prod-datadog-key
SENTRY_DSN=https://...@sentry.io/...
PAGERDUTY_TOKEN=your-pagerduty-token
```

**Environment Variables**:
```
ENVIRONMENT_NAME=production
CLUSTER_NAME=prod-cluster
ENABLE_MONITORING=true
DEPLOYMENT_STRATEGY=blue-green
```

## 📋 Environment Configuration Details

### Development Environment

```yaml
Name: development
URL: https://dev.yourdomain.com (optional)
Protection:
  - Wait timer: 0
  - Required reviewers: 0
  - Branch: dev only
Secrets:
  - VITE_API_URL: https://dev-backend.yourdomain.com
Variables:
  - ENVIRONMENT_NAME: development
  - LOG_LEVEL: debug
```

**Usage in Workflow**:
```yaml
deploy-dev:
  name: 🚀 Deploy to Dev
  environment:
    name: development
    url: https://dev.yourdomain.com
  runs-on: ubuntu-latest
  steps:
    - name: Deploy
      run: echo "Deploying to ${{ vars.ENVIRONMENT_NAME }}"
```

### Staging Environment

```yaml
Name: staging
URL: https://staging.yourdomain.com
Protection:
  - Wait timer: 0
  - Required reviewers: 0
  - Branch: staging only
Secrets:
  - VITE_API_URL: https://staging-backend.yourdomain.com
  - DATADOG_API_KEY: <datadog-key>
  - SENTRY_DSN: <sentry-dsn>
Variables:
  - ENVIRONMENT_NAME: staging
  - RUN_E2E_TESTS: true
  - LOG_LEVEL: info
```

**Usage in Workflow**:
```yaml
deploy-staging:
  name: 🎯 Deploy to Staging
  environment:
    name: staging
    url: https://staging.yourdomain.com
  runs-on: ubuntu-latest
  steps:
    - name: Deploy
      run: |
        echo "Deploying to ${{ vars.ENVIRONMENT_NAME }}"
        echo "API URL: ${{ secrets.VITE_API_URL }}"
```

### Production Environment

```yaml
Name: production
URL: https://yourdomain.com
Protection:
  - Wait timer: 0 (or 10 min observation)
  - Required reviewers: 2
    - @devops-lead
    - @platform-engineer
  - Branch: main only
  - Prevent self-review: true
Secrets:
  - VITE_API_URL: https://backend.yourdomain.com
  - DO_REGISTRY: registry.digitalocean.com/ai-incident-assistant
  - DATADOG_API_KEY: <prod-datadog-key>
  - SENTRY_DSN: <prod-sentry-dsn>
  - PAGERDUTY_TOKEN: <pagerduty-token>
Variables:
  - ENVIRONMENT_NAME: production
  - DEPLOYMENT_STRATEGY: blue-green
  - ENABLE_MONITORING: true
  - LOG_LEVEL: warn
```

**Usage in Workflow**:
```yaml
deploy-production:
  name: 🏭 Deploy to Production
  environment:
    name: production
    url: https://yourdomain.com
  runs-on: ubuntu-latest
  steps:
    - name: Wait for approval
      run: echo "Deployment requires manual approval from reviewers"
    
    - name: Deploy
      run: |
        echo "Deploying to ${{ vars.ENVIRONMENT_NAME }}"
        echo "Strategy: ${{ vars.DEPLOYMENT_STRATEGY }}"
```

## 🔐 Secrets Management

### Repository-Level Secrets (Shared)
These apply to ALL environments:

```
Settings → Secrets and Variables → Actions → New repository secret
```

**Repository Secrets**:
```
DO_REGISTRY=registry.digitalocean.com/ai-incident-assistant
DO_REGISTRY_TOKEN=dop_v1_xxxxx
SONAR_TOKEN=squ_xxxxx
SONAR_HOST_URL=https://sonarcloud.io
GITHUB_TOKEN=(automatically provided)
```

### Environment-Level Secrets
These override repository secrets for specific environments:

**Development**:
- `VITE_API_URL`: Dev backend URL
- `DATABASE_URL`: Dev database connection (if needed)

**Staging**:
- `VITE_API_URL`: Staging backend URL
- `DATABASE_URL`: Staging database
- `DATADOG_API_KEY`: Staging monitoring

**Production**:
- `VITE_API_URL`: Production backend URL
- `DATABASE_URL`: Production database
- `DATADOG_API_KEY`: Production monitoring
- `PAGERDUTY_TOKEN`: Incident management
- `SLACK_WEBHOOK`: Deployment notifications

## 🎭 Approval Workflow

### How It Works

1. **Developer merges PR to main**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **CI Pipeline runs automatically**
   - Secret scan ✅
   - Tests ✅
   - Build Docker image ✅
   - Security scan ✅
   - Push to registry ✅

3. **Deployment waits for approval**
   ```
   GitHub Actions → deploy-production job → "Waiting for review"
   ```

4. **Reviewer gets notification**
   - Email notification
   - GitHub notification
   - Can review deployment in Actions tab

5. **Reviewer approves or rejects**
   ```
   Actions → Workflow run → Review deployments → Approve/Reject
   ```

6. **On approval, deployment proceeds**
   - Deploys to Prod-East
   - Health checks
   - Deploys to Prod-West
   - Deploys to Prod-EU

### Approval Best Practices

✅ **Do**:
- Review test results before approving
- Check staging environment first
- Verify no critical alerts
- Schedule deploys during business hours
- Document approval reason

❌ **Don't**:
- Approve without checking logs
- Deploy during high-traffic hours
- Skip staging validation
- Approve your own changes

## 📊 Deployment History

View deployment history:
```
Repo → Actions → Environments → production → View deployments
```

Each deployment shows:
- Commit SHA
- Workflow run
- Approver name
- Timestamp
- Status (Success/Failed/Pending)

## 🚨 Emergency Rollback

If production deployment fails:

```bash
# 1. Reject the deployment in GitHub UI
GitHub Actions → Current workflow → Review → Reject

# 2. Or trigger rollback workflow
git revert <bad-commit-sha>
git push origin main

# 3. Approve rollback deployment
# (Much faster approval process for rollbacks)
```

## 🔄 Updating Environment Configuration

### Add New Secret

```bash
# Via GitHub UI
Settings → Environments → production → Add secret

# Secret name: NEW_SECRET_KEY
# Secret value: your-secret-value
```

### Add New Variable

```bash
# Via GitHub UI
Settings → Environments → production → Add variable

# Variable name: FEATURE_FLAG_XYZ
# Variable value: true
```

### Update Protection Rules

```bash
Settings → Environments → production → Protection rules
- Add/remove required reviewers
- Change wait timer
- Modify deployment branches
```

## 📖 Reference

### GitHub Environment Features

| Feature | Dev | Staging | Production |
|---------|-----|---------|------------|
| Auto-deploy | ✅ | ✅ | ❌ |
| Required reviewers | 0 | 0 | 2 |
| Wait timer | 0 min | 0 min | 0-10 min |
| Branch restriction | dev | staging | main |
| Deployment URL | ✅ | ✅ | ✅ |
| Environment secrets | ✅ | ✅ | ✅ |

### Workflow Syntax

```yaml
jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment:
      name: production          # Environment name
      url: https://example.com  # Deployment URL (optional)
    steps:
      - name: Deploy
        run: |
          echo "Environment: ${{ vars.ENVIRONMENT_NAME }}"
          echo "Secret: ${{ secrets.API_KEY }}"
```

## 🔗 Related Documentation

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments)
- [Deployment Protection Rules](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#deployment-protection-rules)
- [Environment Secrets](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment#environment-secrets)

---

**Last Updated**: December 3, 2025  
**Maintained by**: DevOps Team
