# Complete CI/CD Setup Guide - Step by Step

## Overview
This guide sets up a complete cloud-native CI/CD pipeline with:
- ✅ Kubernetes cluster on DigitalOcean
- ✅ GitHub Actions CI/CD pipeline
- ✅ ArgoCD for GitOps deployment
- ✅ Multi-environment setup (dev, staging, production)

---

## Phase 1: Initial Setup (15 minutes)

### Step 1: Get Required Accounts & Tokens

1. **GitHub Account**: Already have (0019-KDU)

2. **DigitalOcean Account**: 
   - Login to: https://cloud.digitalocean.com/
   - Go to: API → Tokens/Keys → Generate New Token
   - Name: `terraform-ci-cd`
   - Permissions: Read & Write
   - **Save token**: `dop_v1_xxxxxxxxxxxxxxx`

3. **GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Select scopes: `repo`, `workflow`, `write:packages`
   - **Save token**: `ghp_xxxxxxxxxxxxxxx`

4. **OpenAI API Key** (optional):
   - Go to: https://platform.openai.com/api-keys
   - Create new secret key
   - **Save key**: `sk-xxxxxxxxxxxxxxx`

---

## Phase 2: Infrastructure Setup (20 minutes)

### Step 2: Create Kubernetes Cluster with Terraform

```powershell
# Navigate to terraform directory
cd D:\devops94\cloud-native-ci-cd-blueprint\infra\terraform

# Set DigitalOcean token
$env:TF_VAR_do_token = "dop_v1_your_token_here"

# Initialize Terraform
terraform init

# Review what will be created
terraform plan -var-file="envs/dev.tfvars"

# Create the cluster (takes 5-10 minutes)
terraform apply -var-file="envs/dev.tfvars"
# Type: yes

# Note the outputs:
# - cluster_endpoint
# - cluster_id
# - kubeconfig_path
```

### Step 3: Connect to Kubernetes Cluster

```powershell
# Set kubeconfig
$env:KUBECONFIG = "D:\devops94\cloud-native-ci-cd-blueprint\infra\terraform\kubeconfig-dev.yaml"

# Verify connection
kubectl get nodes
# Should show 1 node in Ready status

# Check cluster info
kubectl cluster-info
```

---

## Phase 3: ArgoCD Setup (15 minutes)

### Step 4: Install ArgoCD

```powershell
# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready (2-3 minutes)
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Expose ArgoCD with LoadBalancer
kubectl patch svc argocd-server -n argocd --patch-file D:\devops94\cloud-native-ci-cd-blueprint\infra\argocd\argocd-loadbalancer-patch.yaml

# Wait for external IP (2-3 minutes)
kubectl get svc argocd-server -n argocd -w
# Press Ctrl+C when EXTERNAL-IP appears
```

### Step 5: Access ArgoCD UI

```powershell
# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

# Get ArgoCD URL
kubectl get svc argocd-server -n argocd -o jsonpath="{.status.loadBalancer.ingress[0].ip}"

# Open browser to: http://<EXTERNAL-IP>
# Username: admin
# Password: (from command above)
```

---

## Phase 4: Application Configuration (10 minutes)

### Step 6: Update Application Secrets

Edit these files with your actual values:

**1. Backend Secrets**
```powershell
# Edit: infra/k8s/overlays/dev/backend-secrets.yaml
# Update:
#   OPENAI_API_KEY: "sk-your-actual-openai-key"
```

**2. PostgreSQL Password**
```powershell
# Edit: infra/k8s/overlays/dev/postgres-secret.yaml
# Password is already set to: dev_password_123
# Change if needed
```

### Step 7: Deploy Application Manually (First Time)

```powershell
cd D:\devops94\cloud-native-ci-cd-blueprint

# Deploy application to Kubernetes
kubectl apply -k infra/k8s/overlays/dev

# Watch deployment progress
kubectl get pods -n dev -w
# Wait until all pods are Running (2-3 minutes)
# Press Ctrl+C when ready

# Get application URL
kubectl get svc -n dev
# Look for frontend or ingress EXTERNAL-IP
```

---

## Phase 5: GitOps with ArgoCD (10 minutes)

### Step 8: Push Code to GitHub

```powershell
cd D:\devops94\cloud-native-ci-cd-blueprint

# Check what files changed
git status

# Add all changes
git add .

# Commit
git commit -m "feat: Complete K8s manifests, Terraform, and ArgoCD setup"

# Push to GitHub
git push origin ci/update-github-actions
```

### Step 9: Configure ArgoCD Application

```powershell
# Deploy ArgoCD application
kubectl apply -f infra/argocd/dev-application.yaml

# Check ArgoCD synced the app
kubectl get application -n argocd

# In ArgoCD UI:
# 1. Click on "ai-incident-assistant-dev"
# 2. Click "SYNC" button
# 3. Click "SYNCHRONIZE"
# 4. Watch deployment in UI
```

---

## Phase 6: GitHub Actions CI/CD (15 minutes)

### Step 10: Configure GitHub Secrets

Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/settings/secrets/actions

Add these secrets:

1. **DO_REGISTRY_TOKEN**
   - Value: Your DigitalOcean API token
   - `dop_v1_xxxxxxxxxxxxxxx`

2. **KUBE_CONFIG_DEV**
   - Get from: `cat infra/terraform/kubeconfig-dev.yaml`
   - Copy entire file content

3. **SONAR_TOKEN** (optional)
   - Go to: https://sonarcloud.io/
   - Create account and project
   - Generate token

### Step 11: Configure GitHub Environments

Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/settings/environments

**Create 3 environments:**

**1. development**
- Deployment branches: `dev`
- Secrets: None needed (uses repository secrets)

**2. staging**  
- Deployment branches: `staging`
- Required reviewers: 0
- Environment URL: `http://<staging-cluster-ip>`

**3. production**
- Deployment branches: `main`
- Required reviewers: 1-2 people
- Environment URL: `http://<production-cluster-ip>`

### Step 12: Test CI/CD Pipeline

```powershell
# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger CI/CD pipeline"
git push origin ci/update-github-actions

# Watch pipeline in GitHub:
# https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions

# Pipeline will:
# 1. Run tests
# 2. Build Docker images
# 3. Push to DigitalOcean registry
# 4. Deploy to dev environment via ArgoCD
```

---

## Phase 7: Verification (5 minutes)

### Step 13: Verify Everything Works

```powershell
# 1. Check Kubernetes pods
kubectl get pods -n dev
# All should be Running

# 2. Check services
kubectl get svc -n dev
# Note EXTERNAL-IPs

# 3. Check ArgoCD
# Open ArgoCD UI
# Application should be green "Healthy" and "Synced"

# 4. Test application
# Open browser to frontend EXTERNAL-IP
# Should see your application running

# 5. Check GitHub Actions
# Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/actions
# Latest workflow should be successful (green checkmark)
```

---

## Phase 8: Create Staging & Production (Optional)

### Step 14: Create Staging Cluster

```powershell
cd D:\devops94\cloud-native-ci-cd-blueprint\infra\terraform

# Create staging cluster
terraform apply -var-file="envs/staging.tfvars"

# Create staging branch
git checkout -b staging
git push origin staging

# Configure ArgoCD for staging
kubectl apply -f infra/argocd/staging-application.yaml
```

### Step 15: Create Production Cluster

```powershell
# Create production cluster
terraform apply -var-file="envs/prod.tfvars"

# Production deploys from main branch
# Merge ci/update-github-actions → main when ready
```

---

## Troubleshooting

### Common Issues:

**1. ArgoCD shows "app path does not exist"**
```powershell
# Solution: Push code to GitHub first
git push origin ci/update-github-actions
```

**2. Pods stuck in Pending**
```powershell
# Check events
kubectl describe pod <pod-name> -n dev

# Common causes:
# - Insufficient resources (increase node size)
# - Image pull errors (check registry credentials)
```

**3. GitHub Actions fails**
```powershell
# Check secrets are configured:
# - DO_REGISTRY_TOKEN
# - KUBE_CONFIG_DEV
# - SONAR_TOKEN (optional)
```

**4. Can't access application**
```powershell
# Wait for LoadBalancer (2-5 minutes)
kubectl get svc -n dev -w

# Check ingress
kubectl get ingress -n dev
```

---

## Daily Workflow

After setup, your workflow is:

1. **Make code changes** locally
2. **Commit and push** to GitHub
3. **GitHub Actions** automatically:
   - Runs tests
   - Builds Docker images  
   - Pushes to registry
4. **ArgoCD** automatically:
   - Detects changes
   - Deploys to Kubernetes
5. **Monitor** in ArgoCD UI

---

## Cost Estimate

**Monthly costs:**
- Dev cluster (1 node): ~$24/month
- Staging cluster (2 nodes): ~$48/month  
- Production cluster (3 nodes): ~$144/month
- Container Registry: $5-20/month
- LoadBalancers: $10/month each

**Total for all environments: ~$250-300/month**

---

## Next Steps

1. ✅ Complete Phase 1-7 above
2. Add monitoring (Prometheus + Grafana)
3. Add logging (ELK Stack or Loki)
4. Add SSL certificates (cert-manager)
5. Add custom domain
6. Scale to staging and production

---

## Support

- ArgoCD Docs: https://argo-cd.readthedocs.io/
- DigitalOcean Docs: https://docs.digitalocean.com/products/kubernetes/
- Kubernetes Docs: https://kubernetes.io/docs/
- GitHub Actions Docs: https://docs.github.com/en/actions

---

**Status:** Ready to start! Begin with Phase 1, Step 1.
