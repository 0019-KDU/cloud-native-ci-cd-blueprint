# Quick Start: GitHub Branch Protection Setup

## Step-by-Step Guide (5 minutes)

### 1. Go to Repository Settings
```
https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/settings/branches
```

---

## Main Branch Protection (Production)

### Click "Add branch protection rule"

**Branch name pattern:** `main`

Check these boxes:
- ✅ Require a pull request before merging
  - Required approvals: `2`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Search and add these checks (after first pipeline run):
    - `Backend CI / test`
    - `Frontend CI / test`
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings
- ✅ Do not allow force pushes
- ✅ Allow deletions: **UNCHECKED**

Click **Create** or **Save changes**

---

## Staging Branch Protection

### Click "Add branch protection rule" again

**Branch name pattern:** `staging`

Check these boxes:
- ✅ Require a pull request before merging
  - Required approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Add checks:
    - `Backend CI / test`
    - `Frontend CI / test`
- ✅ Do not allow force pushes

Click **Create**

---

## Dev Branch Protection

### Click "Add branch protection rule" again

**Branch name pattern:** `dev`

Check these boxes:
- ✅ Require a pull request before merging
  - Required approvals: `1`
- ✅ Require status checks to pass before merging
  - Add checks:
    - `Backend CI / test`
    - `Frontend CI / test`

Click **Create**

---

## Test the Setup

### Try Direct Push (Should Fail)

```bash
# This should be BLOCKED
git checkout dev
echo "test" >> test.txt
git add test.txt
git commit -m "test: direct push"
git push origin dev
```

**Expected result:** ❌ Error: "required status checks"

### Correct Way (Via PR)

```bash
# 1. Create feature branch
git checkout dev
git pull origin dev
git checkout -b test/branch-protection

# 2. Make a change
echo "Branch protection test" > test-protection.txt
git add test-protection.txt
git commit -m "test: verify branch protection"

# 3. Push feature branch
git push origin test/branch-protection

# 4. Create PR on GitHub UI
# - Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/pulls
# - Click "New pull request"
# - Base: dev
# - Compare: test/branch-protection
# - Create pull request

# 5. Wait for CI checks to pass
# 6. Request review (or approve if you're admin)
# 7. Merge PR
```

---

## Status Checks Will Appear After

Status checks only appear in the dropdown **after** your pipeline runs once on a PR.

If you don't see status checks now:
1. Skip adding them initially
2. Create a test PR
3. Let pipeline run
4. Go back to Settings → Branches → Edit rule
5. Add the status checks that now appear

---

## Done! 🎉

Your workflow is now:
```
Feature branch → PR to dev (1 approval) → Auto-deploy to dev
Dev → PR to staging (1 approval) → Auto-deploy to staging
Staging → PR to main (2 approvals) → Auto-deploy to prod
```

No direct pushes allowed to protected branches!
