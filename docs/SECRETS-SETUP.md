# GitHub Actions Secrets Setup

This guide helps you set up required secrets for the CI/CD pipeline.

## Required Secrets

### 1. DIGITALOCEAN_ACCESS_TOKEN

**Purpose**: Access DigitalOcean Container Registry and Kubernetes cluster

**How to Get:**
1. Log in to DigitalOcean
2. Go to API → Tokens/Keys
3. Click "Generate New Token"
4. Name: `github-actions-cicd`
5. Scopes: Read & Write
6. Copy the token (you won't see it again!)

**Add to GitHub:**
```bash
# Using GitHub CLI
gh secret set DIGITALOCEAN_ACCESS_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → New repository secret
```

---

### 2. SONAR_TOKEN

**Purpose**: Authenticate with SonarQube for code quality scanning

**How to Get:**
1. Log in to your SonarQube instance
2. Go to My Account → Security
3. Generate a new token
4. Name: `github-actions-cicd`
5. Copy the token

**Add to GitHub:**
```bash
gh secret set SONAR_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

---

### 3. SONAR_HOST_URL

**Purpose**: SonarQube server URL

**Value:** 
- If using SonarCloud: `https://sonarcloud.io`
- If self-hosted: `https://your-sonarqube-instance.com`

**Add to GitHub:**
```bash
gh secret set SONAR_HOST_URL --body "https://sonarcloud.io" --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

---

### 4. GITOPS_PAT

**Purpose**: Allow CI pipeline to update GitOps repository (cloud-native-infrastructure)

**How to Get:**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Name: `gitops-update-token`
4. Expiration: No expiration (or set to 1 year)
5. Scopes required:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click "Generate token"
7. Copy the token immediately

**Add to GitHub:**
```bash
gh secret set GITOPS_PAT --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

**⚠️ Important:** This token must have write access to the `cloud-native-infrastructure` repository.

---

## Verification

### Check All Secrets Are Set
```bash
# List all secrets
gh secret list --repo 0019-KDU/cloud-native-ci-cd-blueprint

# Expected output:
# DIGITALOCEAN_ACCESS_TOKEN  Updated YYYY-MM-DD
# SONAR_TOKEN                Updated YYYY-MM-DD
# SONAR_HOST_URL             Updated YYYY-MM-DD
# GITOPS_PAT                 Updated YYYY-MM-DD
```

### Test Pipeline
```bash
# Trigger a test workflow run
git commit --allow-empty -m "test: trigger pipeline"
git push origin main

# Watch the pipeline
gh run watch
```

---

## Kubernetes Secrets

These secrets must be created in each Kubernetes namespace (dev, staging, prod):

### 1. postgres-secret
```bash
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --from-literal=POSTGRES_DB=incidents \
  -n dev

# Repeat for staging and prod
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --from-literal=POSTGRES_DB=incidents \
  -n staging

kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD=your-secure-password \
  --from-literal=POSTGRES_DB=incidents \
  -n prod
```

### 2. backend-secrets
```bash
kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY=sk-your-openai-key \
  -n dev

kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY=sk-your-openai-key \
  -n staging

kubectl create secret generic backend-secrets \
  --from-literal=OPENAI_API_KEY=sk-your-openai-key \
  -n prod
```

### 3. Container Registry Secret (Auto-Created)
DigitalOcean automatically creates this secret when you link your registry to the cluster:

```bash
# Verify it exists
kubectl get secret ai-incident-assistant -n dev
kubectl get secret ai-incident-assistant -n staging
kubectl get secret ai-incident-assistant -n prod

# If missing, create it:
doctl registry kubernetes-manifest | kubectl apply -f - -n dev
doctl registry kubernetes-manifest | kubectl apply -f - -n staging
doctl registry kubernetes-manifest | kubectl apply -f - -n prod
```

---

## Security Best Practices

### 1. Rotate Secrets Regularly
```bash
# Every 90 days, regenerate:
# - DigitalOcean API token
# - GitHub Personal Access Token
# - SonarQube token
```

### 2. Use Different Credentials Per Environment
```bash
# Production should have separate PostgreSQL password
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD=prod-strong-password \
  -n prod --dry-run=client -o yaml | kubectl apply -f -
```

### 3. Monitor Secret Access
```bash
# Check GitHub Actions audit log
# Settings → Actions → View logs

# Check Kubernetes secret access
kubectl get events -n prod | grep secret
```

### 4. Never Commit Secrets
```bash
# Verify .gitignore includes:
.env
.env.*
*.secret
secrets/
```

---

## Troubleshooting

### "Error: DIGITALOCEAN_ACCESS_TOKEN not found"
```bash
# Verify secret exists
gh secret list --repo 0019-KDU/cloud-native-ci-cd-blueprint | grep DIGITALOCEAN

# Set it again
gh secret set DIGITALOCEAN_ACCESS_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

### "Error: Failed to update GitOps repository"
```bash
# Check GITOPS_PAT has correct permissions:
# 1. Go to GitHub Settings → Developer settings → Personal access tokens
# 2. Find your token
# 3. Verify it has 'repo' and 'workflow' scopes
# 4. Check it hasn't expired

# Regenerate if needed and update secret:
gh secret set GITOPS_PAT --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

### "Error: SonarQube authentication failed"
```bash
# Verify SONAR_TOKEN is valid
# Verify SONAR_HOST_URL is correct (no trailing slash)

# Update if needed:
gh secret set SONAR_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint
gh secret set SONAR_HOST_URL --body "https://sonarcloud.io" --repo 0019-KDU/cloud-native-ci-cd-blueprint
```

### "Error: ImagePullBackOff in Kubernetes"
```bash
# Check registry secret exists
kubectl get secret ai-incident-assistant -n dev

# Recreate if needed
doctl registry kubernetes-manifest | kubectl apply -f - -n dev

# Restart deployment
kubectl rollout restart deployment/backend -n dev
```

---

## Quick Setup Script

Run this to set up all secrets at once:

```bash
# Set GitHub repository secrets
gh secret set DIGITALOCEAN_ACCESS_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint
gh secret set SONAR_TOKEN --repo 0019-KDU/cloud-native-ci-cd-blueprint
gh secret set SONAR_HOST_URL --body "https://sonarcloud.io" --repo 0019-KDU/cloud-native-ci-cd-blueprint
gh secret set GITOPS_PAT --repo 0019-KDU/cloud-native-ci-cd-blueprint

# Set Kubernetes secrets for all environments
for ns in dev staging prod; do
  kubectl create secret generic postgres-secret \
    --from-literal=POSTGRES_USER=postgres \
    --from-literal=POSTGRES_PASSWORD=your-password \
    --from-literal=POSTGRES_DB=incidents \
    -n $ns --dry-run=client -o yaml | kubectl apply -f -
  
  kubectl create secret generic backend-secrets \
    --from-literal=OPENAI_API_KEY=your-openai-key \
    -n $ns --dry-run=client -o yaml | kubectl apply -f -
  
  doctl registry kubernetes-manifest | kubectl apply -f - -n $ns
done

echo "✅ All secrets configured!"
```

---

## Reference

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [DigitalOcean API Tokens](https://docs.digitalocean.com/reference/api/create-personal-access-token/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [SonarQube Authentication](https://docs.sonarqube.org/latest/user-guide/user-token/)
