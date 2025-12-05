# GitHub Branch Protection Rules Configuration

This document provides the configuration for branch protection rules to enforce PR-based workflow.

## Overview

Branch protection rules prevent direct pushes to critical branches and enforce code review requirements.

## Configuration Steps

### 1. Access Branch Protection Settings

1. Go to your repository: `https://github.com/0019-KDU/cloud-native-ci-cd-blueprint`
2. Click **Settings** → **Branches** → **Add branch protection rule**

---

## Protection Rules for `main` Branch

### Branch Name Pattern
```
main
```

### Required Settings

#### ✅ Require a pull request before merging
- [x] **Require approvals**: 2
- [x] **Dismiss stale pull request approvals when new commits are pushed**
- [x] **Require review from Code Owners** (optional, if CODEOWNERS file exists)
- [x] **Require approval of the most recent reviewable push**

#### ✅ Require status checks to pass before merging
- [x] **Require branches to be up to date before merging**
- Required status checks:
  - `Backend CI / secret-scan`
  - `Backend CI / test`
  - `Backend CI / sonar`
  - `Backend CI / build`
  - `Backend CI / security-scan`
  - `Frontend CI / secret-scan`
  - `Frontend CI / test`
  - `Frontend CI / sonar`
  - `Frontend CI / build`
  - `Frontend CI / security-scan`

#### ✅ Require conversation resolution before merging
- [x] **All conversations must be resolved**

#### ✅ Require signed commits (Optional but recommended)
- [ ] Require signed commits

#### ✅ Require linear history
- [x] **Prevent merge commits** (optional - enforces rebase or squash)

#### ✅ Block force pushes
- [x] **Do not allow force pushes**

#### ✅ Lock branch
- [ ] Lock branch (only if you want to make it read-only)

#### ✅ Restrict who can push to matching branches
- [x] **Restrict pushes that create matching branches**
- Add allowed users/teams (repository admins only)

---

## Protection Rules for `staging` Branch

### Branch Name Pattern
```
staging
```

### Required Settings

#### ✅ Require a pull request before merging
- [x] **Require approvals**: 1
- [x] **Dismiss stale pull request approvals when new commits are pushed**

#### ✅ Require status checks to pass before merging
- [x] **Require branches to be up to date before merging**
- Required status checks:
  - `Backend CI / secret-scan`
  - `Backend CI / test`
  - `Backend CI / sonar`
  - `Backend CI / build`
  - `Backend CI / security-scan`
  - `Frontend CI / secret-scan`
  - `Frontend CI / test`
  - `Frontend CI / sonar`
  - `Frontend CI / build`
  - `Frontend CI / security-scan`

#### ✅ Require conversation resolution before merging
- [x] **All conversations must be resolved**

#### ✅ Block force pushes
- [x] **Do not allow force pushes**

#### ✅ Restrict who can push to matching branches
- [x] **Restrict pushes that create matching branches**

---

## Protection Rules for `dev` Branch

### Branch Name Pattern
```
dev
```

### Required Settings

#### ✅ Require a pull request before merging
- [x] **Require approvals**: 1
- [x] **Dismiss stale pull request approvals when new commits are pushed**

#### ✅ Require status checks to pass before merging
- [x] **Require branches to be up to date before merging**
- Required status checks:
  - `Backend CI / test`
  - `Frontend CI / test`

#### ✅ Block force pushes
- [x] **Do not allow force pushes** (optional for dev, can allow for quick fixes)

---

## Workflow After Configuration

### Feature Development Flow

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# 2. Make changes and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 3. Create Pull Request on GitHub
# - Base: dev
# - Compare: feature/new-feature
# - CI will run automatically

# 4. After approval, merge to dev
# - Dev pipeline deploys to dev cluster

# 5. When ready for staging, create PR
# - Base: staging
# - Compare: dev
# - After approval, merge
# - Staging pipeline deploys to staging cluster

# 6. When ready for production, create PR
# - Base: main
# - Compare: staging
# - Requires 2 approvals
# - After approval, merge
# - Production pipeline deploys to prod cluster
```

### Emergency Hotfix Flow (Production)

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix and push
git add .
git commit -m "fix: critical production bug"
git push origin hotfix/critical-bug

# 3. Create PR to main
# - Requires 2 approvals (can be expedited)

# 4. After merge, backport to staging and dev
git checkout staging
git merge main
git push origin staging

git checkout dev
git merge staging
git push origin dev
```

---

## Bypass Protection (Emergency Only)

Repository administrators can temporarily bypass protection rules:

1. Go to **Settings** → **Branches** → **Edit** protection rule
2. Uncheck specific requirements temporarily
3. **Remember to re-enable after emergency**

---

## CODEOWNERS File (Optional)

Create `.github/CODEOWNERS` to automatically request reviews:

```
# Infrastructure changes
/infra/**                    @0019-KDU
/.github/workflows/**        @0019-KDU

# Backend code
/backend/**                  @backend-team

# Frontend code
/frontend/**                 @frontend-team

# Documentation
/docs/**                     @0019-KDU
*.md                         @0019-KDU
```

---

## Status Check Names Reference

The status check names come from your GitHub Actions workflow:

### Backend Pipeline (`backend-pipeline.yml`)
```yaml
name: Backend CI
jobs:
  secret-scan:    # Backend CI / secret-scan
  test:           # Backend CI / test
  sonar:          # Backend CI / sonar
  build:          # Backend CI / build
  security-scan:  # Backend CI / security-scan
  push:           # Backend CI / push
  deploy:         # Backend CI / deploy
```

### Frontend Pipeline (`frontend-pipeline.yml`)
```yaml
name: Frontend CI
jobs:
  secret-scan:    # Frontend CI / secret-scan
  test:           # Frontend CI / test
  sonar:          # Frontend CI / sonar
  build:          # Frontend CI / build
  security-scan:  # Frontend CI / security-scan
  push:           # Frontend CI / push
  deploy:         # Frontend CI / deploy
```

---

## Verification

After setting up branch protection:

1. Try to push directly to `dev`:
   ```bash
   git checkout dev
   echo "test" >> test.txt
   git add test.txt
   git commit -m "test direct push"
   git push origin dev
   ```
   **Expected**: ❌ Push rejected - requires PR

2. Create a PR:
   ```bash
   git checkout -b test-branch
   git push origin test-branch
   ```
   Then create PR on GitHub → ✅ Should work

---

## Additional Recommendations

### 1. Enable Required Status Checks
After first successful pipeline run, GitHub will show available checks.

### 2. Set Up Dependabot
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
  - package-ecosystem: "docker"
    directory: "/infra/docker"
    schedule:
      interval: "weekly"
```

### 3. Enable Security Alerts
- Settings → Security → Enable Dependabot alerts
- Settings → Security → Enable Dependabot security updates

---

## Troubleshooting

### "Status check required but not present"
- Push a commit to trigger the pipeline
- Wait for checks to complete
- GitHub will recognize the check names

### "Cannot merge due to protected branch"
- Verify you created a PR (not pushing directly)
- Ensure all required status checks passed
- Get required approvals

### "Force push blocked"
- Never force push to protected branches
- If needed, create new PR with corrected commits

---

## Quick Setup Commands (GitHub CLI)

If you have GitHub CLI installed:

```bash
# Protect main branch
gh api repos/0019-KDU/cloud-native-ci-cd-blueprint/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=2 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field enforce_admins=true \
  --field required_linear_history=true \
  --field allow_force_pushes=false

# Protect staging branch
gh api repos/0019-KDU/cloud-native-ci-cd-blueprint/branches/staging/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field allow_force_pushes=false

# Protect dev branch
gh api repos/0019-KDU/cloud-native-ci-cd-blueprint/branches/dev/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true
```

---

## Summary

✅ **main**: 2 approvals, all CI checks, no force push, conversations resolved
✅ **staging**: 1 approval, all CI checks, no force push, conversations resolved  
✅ **dev**: 1 approval, test checks, optional force push

This ensures:
- Code quality through reviews
- Automated testing before merge
- Proper promotion flow: feature → dev → staging → main
- No accidental direct pushes to critical branches
