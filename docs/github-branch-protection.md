# GitHub Branch Protection Configuration

## Overview

This document describes the exact GitHub branch protection rules needed for the production-grade GitOps CI/CD system.

## Branch Protection Rules for `main`

### Required Settings

1. **Require pull request before merging**
   - ✅ Enabled
   - ✅ Require approvals: 1 (recommended, adjust based on team size)
   - ❌ Dismiss stale pull request approvals when new commits are pushed (optional)
   - ❌ Require review from Code Owners (optional)

2. **Require status checks before merging**
   - ✅ Enabled
   - ✅ Require branches to be up to date before merging
   
   **Required status checks:**
   - `Backend Tests & SonarQube`
   - `Frontend Tests & SonarQube`

3. **Require conversation resolution before merging**
   - ✅ Enabled (recommended)

4. **Do not allow bypassing the above settings**
   - ✅ Enabled

5. **Restrict who can push to matching branches**
   - ✅ Enabled
   - ❌ Allow nobody to push (force all changes through PRs)

6. **Allow force pushes**
   - ❌ Disabled

7. **Allow deletions**
   - ❌ Disabled

## How It Works

### For Feature PRs (feature/* → main)

1. Developer creates PR from `feature/*` branch to `main`
2. **pr-validation.yaml** workflow runs:
   - Backend Tests & SonarQube ✅
   - Frontend Tests & SonarQube ✅
3. No images are built or pushed
4. No deployments happen
5. PR can merge when:
   - All required checks pass
   - Approvals received (if configured)
   - Conversations resolved

### For GitOps PRs (deploy/* → main)

1. CI workflow creates PR from `deploy/dev-*` branch
2. **gitops-checks.yaml** workflow runs:
   - Provides lightweight jobs that satisfy the same required check names
   - `Backend Tests & SonarQube` (skipped, just passes)
   - `Frontend Tests & SonarQube` (skipped, just passes)
   - `Validate Kustomization` (actual validation)
3. PR passes all required checks
4. PR can auto-merge (dev) or manually merge (staging/prod)

## Why This Works

The key insight is that **GitHub checks status by job name**, not workflow name:

- **pr-validation.yaml** has jobs named:
  - `backend-test` (Name: "Backend Tests & SonarQube")
  - `frontend-test` (Name: "Frontend Tests & SonarQube")

- **gitops-checks.yaml** has matching jobs named:
  - `backend-test` (Name: "Backend Tests & SonarQube") - lightweight skip job
  - `frontend-test` (Name: "Frontend Tests & SonarQube") - lightweight skip job

Both workflows satisfy the same required check names, but:
- Feature PRs run actual tests
- GitOps PRs skip tests (images already built and tested)

## Configuration Steps

### Via GitHub UI

1. Go to repository **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Configure as specified above
5. Add required status checks:
   - Type: `Backend Tests & SonarQube`
   - Type: `Frontend Tests & SonarQube`
6. Click **Create** or **Save changes**

### Via GitHub API

```bash
curl -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://api.github.com/repos/0019-KDU/cloud-native-ci-cd-blueprint/branches/main/protection \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": [
        "Backend Tests & SonarQube",
        "Frontend Tests & SonarQube"
      ]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismissal_restrictions": {},
      "dismiss_stale_reviews": false,
      "require_code_owner_reviews": false,
      "required_approving_review_count": 1
    },
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }'
```

## Verification

To verify the configuration is correct:

1. Create a test feature branch:
   ```bash
   git checkout -b feature/test-branch-protection
   echo "test" >> README.md
   git add README.md
   git commit -m "test: verify branch protection"
   git push origin feature/test-branch-protection
   ```

2. Open a PR to `main`
3. Verify that:
   - ✅ PR validation workflow runs
   - ✅ Tests execute (Backend Tests & SonarQube, Frontend Tests & SonarQube)
   - ✅ Merge button is blocked until checks pass
   - ✅ Cannot push directly to `main`

4. For GitOps PR verification:
   - Merge code to main (triggers CI/CD - Dev)
   - Dev workflow creates GitOps PR
   - Verify that:
     - ✅ GitOps checks workflow runs
     - ✅ Jobs skip tests but pass status checks
     - ✅ PR can merge without running heavy CI

## Troubleshooting

### Issue: GitOps PRs blocked by required checks

**Problem:** GitOps PRs can't merge because required checks don't run.

**Solution:** Ensure `gitops-checks.yaml` has jobs with **exact same names** as `pr-validation.yaml`:
- Job ID can differ
- Job **Name** must match exactly

### Issue: Required checks not appearing

**Problem:** After configuring branch protection, required checks don't appear in the list.

**Solution:**
1. The checks must have run at least once on a PR
2. Push a test PR to trigger the workflows
3. Then return to branch protection settings and add the checks

### Issue: Wrong workflow running for PR type

**Problem:** Feature PRs trigger GitOps checks, or vice versa.

**Solution:** Check the `paths` filters in workflow triggers:
- **pr-validation.yaml**: `backend/**`, `frontend/**`, `tests/**`
- **gitops-checks.yaml**: `infra/k8s/overlays/**`

Make sure these path filters don't overlap and cover all necessary files.

## Summary

This configuration ensures:

1. ✅ All code changes go through PRs
2. ✅ All PRs require tests to pass
3. ✅ GitOps PRs satisfy checks without running heavy CI
4. ✅ No direct pushes to `main`
5. ✅ Clean separation between CI (tests) and CD (deployments)
6. ✅ Git is only used for desired state storage
7. ✅ Kubernetes is the source of truth for environments
