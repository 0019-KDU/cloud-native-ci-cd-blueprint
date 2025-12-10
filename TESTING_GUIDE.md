# 🧪 Testing Your CI/CD Pipeline - Step by Step

## ✅ What We're Testing

1. **Staging Validation Workflow** - E2E and Load tests
2. **Production Deployment Workflow** - Deployment PR creation
3. **CI Pipeline Integration** - End-to-end flow

---

## 🎯 Test Plan

### Phase 1: Local Test Validation ⚡ (5 minutes)
**Goal**: Verify tests can run locally

### Phase 2: Staging Validation Workflow 🧪 (30 minutes)
**Goal**: Test automated staging validation

### Phase 3: Production Deployment Simulation 🚀 (10 minutes)
**Goal**: Test production deployment workflow (dry-run)

---

## 📋 Phase 1: Local Test Validation

### Step 1.1: Verify Test Files Exist
```powershell
# Check E2E tests
Get-ChildItem tests\e2e\*.spec.js

# Check Load tests
Get-ChildItem tests\load-tests\*.js

# Check package.json
Get-Content tests\package.json | Select-String "playwright|k6"
```

**Expected Output**: Files should exist

### Step 1.2: Test Staging Environment Health
```powershell
# Test staging API
Invoke-WebRequest -Uri "http://staging.174.138.120.13.nip.io/api/incidents" -UseBasicParsing

# Test frontend
Invoke-WebRequest -Uri "http://staging.174.138.120.13.nip.io/" -UseBasicParsing
```

**Expected Output**: HTTP 200 responses

### Step 1.3: Install Test Dependencies (Optional)
```powershell
cd tests
npm install

# For k6 (if you want to run load tests locally)
# Windows: choco install k6
# Or download from: https://k6.io/docs/get-started/installation/
```

### Step 1.4: Run a Quick E2E Test Locally
```powershell
cd tests

# Set environment variable
$env:BASE_URL = "http://staging.174.138.120.13.nip.io"

# Run tests (if dependencies installed)
npm run test:e2e

# Or just verify test files are valid JavaScript
node -c e2e\incidents.spec.js
```

---

## 📋 Phase 2: Staging Validation Workflow

### Step 2.1: Commit and Push Workflow Files
```powershell
# Add new workflow files
git add .github\workflows\staging-validation.yml
git add .github\workflows\production-deployment.yml
git add docs\CICD_PIPELINE.md
git add docs\QUICK_DEPLOYMENT_GUIDE.md

# Commit
git commit -m "feat: add staging validation and production deployment workflows"

# Push to GitHub
git push origin main
```

### Step 2.2: Verify Workflows Appear in GitHub
```powershell
# Open GitHub Actions page
Start-Process "https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions"
```

**Manual Steps**:
1. Go to GitHub → Actions tab
2. You should see 3 workflows:
   - ✅ CI Pipeline - Build Once Deploy Many
   - ✅ Staging Validation Tests (NEW)
   - ✅ Production Deployment Pipeline (NEW)

### Step 2.3: Manually Trigger Staging Validation

**Option A: Using GitHub UI** (Recommended for first test)
```
1. Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions
2. Click "Staging Validation Tests" in left sidebar
3. Click "Run workflow" button (top right)
4. Select test type: "smoke" (fastest for testing)
5. Click green "Run workflow" button
6. Wait ~2-3 minutes
7. Click on the running workflow to see progress
```

**Option B: Using GitHub CLI**
```powershell
# Install GitHub CLI if not installed
# winget install --id GitHub.cli

# Login
gh auth login

# Trigger staging validation with smoke tests only
gh workflow run staging-validation.yml -f test_type=smoke

# Check status
gh run list --workflow=staging-validation.yml --limit 5

# View live logs
gh run watch
```

### Step 2.4: Verify Test Results

**Expected Behavior**:
```
Job 1: smoke-test
  ✅ Wait for staging to be ready (30 attempts max)
  ✅ Test /api/incidents (should return 200)
  ✅ Test /api/analytics/overview (should return 200)
  ✅ Test frontend / (should return 200)
  
Job 2: e2e-test (if test_type=all)
  ⏭️ Skipped (unless test_type=all or e2e)
  
Job 3: load-test (if test_type=all)
  ⏭️ Skipped (unless test_type=all or load)
  
Job 4: test-summary
  ✅ Generate test summary
  ✅ Create GitHub Step Summary
```

### Step 2.5: Download Test Artifacts (if E2E/Load ran)
```powershell
# List recent runs
gh run list --workflow=staging-validation.yml --limit 5

# Download artifacts from specific run
gh run download <RUN_ID>

# Artifacts will be in current directory:
# - e2e-test-results/ (if E2E tests ran)
# - playwright-report/ (if E2E tests ran)
# - k6-results/ (if load tests ran)
```

---

## 📋 Phase 3: Production Deployment Workflow Test

### Step 3.1: Get Current Image Tag
```powershell
# Get latest commit SHA (this is your image tag)
$IMAGE_TAG = git rev-parse HEAD
Write-Host "Image Tag: $IMAGE_TAG" -ForegroundColor Green
```

### Step 3.2: Verify Images Exist in Registry

**Manual Verification** (recommended):
```
1. Login to DigitalOcean: https://cloud.digitalocean.com/
2. Go to Container Registry → ai-incident-assistant
3. Check if backend and frontend have tags matching your commit SHA
```

**Note**: Images are created by CI pipeline when you push to main. If you just committed the workflow files, they won't have matching images yet because CI pipeline didn't build new code.

### Step 3.3: Trigger Production Deployment (DRY RUN)

**⚠️ WARNING**: This will create a REAL deployment PR. Only do this if:
- You have images in registry matching the commit SHA
- You're ready to test the full workflow

```powershell
# Option A: Trigger with current commit (use with caution)
gh workflow run production-deployment.yml -f image_tag=$IMAGE_TAG

# Option B: Use an existing image tag that you know works
# Get the last deployed image tag from staging
$EXISTING_TAG = (Get-Content infra\k8s\overlays\staging\kustomization.yaml | Select-String "newTag").ToString().Split(":")[1].Trim()
Write-Host "Using existing tag: $EXISTING_TAG" -ForegroundColor Yellow

gh workflow run production-deployment.yml -f image_tag=$EXISTING_TAG -f skip_load_test=true
```

### Step 3.4: Watch Workflow Progress
```powershell
# List runs
gh run list --workflow=production-deployment.yml --limit 5

# Watch latest run
gh run watch
```

**Expected Behavior**:
```
Job 1: pre-deployment-check
  ✅ Verify images exist in registry
  ✅ Check staging test results
  
Job 2: create-deployment-pr
  ✅ Create deployment branch
  ✅ Update prod manifests
  ✅ Commit changes
  ✅ Create Pull Request
  ✅ Add labels (deployment, production, needs-approval)
  ✅ Request reviews
  
Output: PR URL
```

### Step 3.5: Review the Deployment PR

```powershell
# List deployment PRs
gh pr list --label deployment

# View the PR
gh pr view <PR_NUMBER>

# Open PR in browser
gh pr view <PR_NUMBER> --web
```

**What to Check in PR**:
- ✅ Title: "🚀 Production Deployment: [commit-sha]"
- ✅ Labels: deployment, production, needs-approval
- ✅ Description includes:
  - Image tags
  - Pre-deployment checklist
  - Deployment steps
  - Rollback plan
- ✅ Changes only in: `infra/k8s/overlays/prod/kustomization.yaml`

### Step 3.6: Test PR Workflow (Optional - Don't Merge Yet!)

```powershell
# Add a comment to the PR
gh pr comment <PR_NUMBER> --body "Testing deployment workflow - looks good! 🎉"

# Request changes (simulate rejection)
gh pr review <PR_NUMBER> --request-changes --body "Testing workflow - need to verify staging tests passed"

# Approve (if you want to test approval flow)
gh pr review <PR_NUMBER> --approve --body "Staging tests passed, approved for production"

# DO NOT MERGE unless you actually want to deploy to production
# To close the test PR without merging:
gh pr close <PR_NUMBER> --comment "Test completed, closing PR without merge"
```

---

## 🎯 Quick Smoke Test (2 minutes)

If you just want to verify everything works quickly:

```powershell
# 1. Commit workflow files
git add .github\workflows\*.yml docs\*.md
git commit -m "feat: add CI/CD workflows"
git push origin main

# 2. Trigger smoke test only
gh workflow run staging-validation.yml -f test_type=smoke

# 3. Watch it run
gh run watch

# Expected: All smoke tests pass in ~2 minutes
```

---

## 📊 Validation Checklist

### ✅ Staging Validation Workflow
- [ ] Workflow appears in GitHub Actions
- [ ] Can be triggered manually
- [ ] Smoke tests run successfully
- [ ] Health checks pass for staging environment
- [ ] Test summary is generated
- [ ] Workflow completes without errors

### ✅ Production Deployment Workflow
- [ ] Workflow appears in GitHub Actions
- [ ] Can be triggered with image tag
- [ ] Pre-deployment checks work
- [ ] Deployment PR is created automatically
- [ ] PR has correct labels and reviewers
- [ ] PR description is complete
- [ ] Changes only affect prod overlay

### ✅ Integration
- [ ] CI pipeline builds images when pushing to main
- [ ] Image tags match git commit SHA
- [ ] Kustomize overlays are updated correctly
- [ ] ArgoCD can see the changes

---

## 🐛 Troubleshooting

### Issue: "Workflow not found"
```powershell
# Verify files are committed
git status
git push origin main

# Wait 30 seconds for GitHub to process
# Refresh Actions page
```

### Issue: "Pre-deployment check fails - images not found"
**Solution**: Use an existing image tag from staging:
```powershell
Get-Content infra\k8s\overlays\staging\kustomization.yaml | Select-String "newTag"
```

### Issue: "Staging endpoint returns 404"
```powershell
# Check staging pods
kubectl get pods -n staging

# Check staging ingress
kubectl get ingress -n staging

# Test staging directly
Invoke-WebRequest -Uri "http://staging.174.138.120.13.nip.io/api/health"
```

### Issue: "Cannot trigger workflow"
```powershell
# Verify GitHub CLI is authenticated
gh auth status

# Re-login if needed
gh auth login

# Check workflow file syntax
Get-Content .github\workflows\staging-validation.yml | Select-String "on:"
```

---

## 🎓 Success Criteria

**Your CI/CD pipeline is working correctly if**:

1. ✅ Staging validation workflow runs successfully
2. ✅ Smoke tests pass (all endpoints return 200)
3. ✅ Production deployment workflow creates a PR
4. ✅ PR contains correct image tags and checklist
5. ✅ Test artifacts are uploaded (if full tests run)
6. ✅ GitHub Actions summary is generated

---

## 🚀 Next Steps After Testing

Once everything works:

1. **Set up Slack Notifications** (optional)
   ```powershell
   # Add Slack webhook to GitHub secrets
   gh secret set SLACK_WEBHOOK_URL
   ```

2. **Configure Team Reviewers**
   - Edit `.github/workflows/production-deployment.yml`
   - Replace `['team-lead-username']` with actual GitHub usernames

3. **Test Full E2E Flow**
   ```powershell
   gh workflow run staging-validation.yml -f test_type=all
   # Wait ~30 minutes for full test suite
   ```

4. **Document Your Process**
   - Update team wiki with deployment procedures
   - Share `docs/QUICK_DEPLOYMENT_GUIDE.md` with team
   - Train team on PR approval process

---

## 📞 Quick Commands Reference

```powershell
# Trigger staging smoke test
gh workflow run staging-validation.yml -f test_type=smoke

# Trigger full staging validation
gh workflow run staging-validation.yml -f test_type=all

# Trigger production deployment
gh workflow run production-deployment.yml -f image_tag=<COMMIT_SHA>

# List recent runs
gh run list --limit 10

# Watch latest run
gh run watch

# View workflow logs
gh run view <RUN_ID> --log

# Download artifacts
gh run download <RUN_ID>
```

---

**Ready to test? Start with Phase 1, then move to Phase 2 for the full workflow test!** 🚀
