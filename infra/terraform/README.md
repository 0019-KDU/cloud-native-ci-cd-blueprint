# Terraform Setup for DigitalOcean Kubernetes

## Prerequisites

1. **DigitalOcean Account** with API token
2. **Terraform** installed (v1.0+)
3. **doctl** CLI (optional, for easy management)

## Setup Steps

### 1. Get DigitalOcean API Token

```bash
# Go to: https://cloud.digitalocean.com/account/api/tokens
# Generate new token with read/write permissions
# Save it securely
```

### 2. Set Environment Variables

```powershell
# PowerShell
$env:TF_VAR_do_token = "dop_v1_your_token_here"

# Or create terraform.tfvars (DO NOT COMMIT!)
echo 'do_token = "dop_v1_your_token_here"' > terraform.tfvars
```

### 3. Initialize Terraform

```bash
cd infra/terraform
terraform init
```

### 4. Plan Infrastructure

```bash
# For dev environment
terraform plan -var-file="envs/dev.tfvars"

# For staging
terraform plan -var-file="envs/staging.tfvars"

# For production
terraform plan -var-file="envs/prod.tfvars"
```

### 5. Apply (Create Resources)

```bash
# Create dev cluster
terraform apply -var-file="envs/dev.tfvars"

# Type 'yes' when prompted
```

### 6. Get Kubeconfig

```bash
# Kubeconfig is saved automatically
export KUBECONFIG=./kubeconfig-dev.yaml

# Or use doctl
doctl kubernetes cluster kubeconfig save ai-incident-assistant-dev
```

### 7. Verify Cluster

```bash
kubectl get nodes
kubectl get namespaces
```

## What Gets Created

✅ **Kubernetes Cluster**
- 2 nodes (dev/staging), 3 nodes (production)
- Auto-scaling enabled
- Latest stable Kubernetes version

✅ **Container Registry**
- For Docker images
- Integrated with cluster

✅ **Kubeconfig File**
- Saved locally: `kubeconfig-{env}.yaml`
- Use with kubectl

❌ **VPC** - Not created (DigitalOcean creates default VPC automatically)
❌ **Managed PostgreSQL** - Disabled (using in-cluster PostgreSQL)
❌ **LoadBalancer** - Disabled (using Kubernetes ingress)

## Cost Estimate

**Dev/Staging:**
- Kubernetes: 2 nodes × $24/month = $48/month
- Container Registry: $5/month
- **Total: ~$53/month**

**Production:**
- Kubernetes: 3 nodes × $48/month = $144/month
- Container Registry: $20/month
- **Total: ~$164/month**

## Destroy Resources

```bash
# Warning: This deletes everything!
terraform destroy -var-file="envs/dev.tfvars"
```

## Connect to Registry

```bash
# Login to registry
doctl registry login

# Or get Docker credentials
terraform output registry_endpoint
```

## Useful Commands

```bash
# Get cluster info
terraform output cluster_endpoint
terraform output cluster_ipv4

# Get registry info
terraform output registry_server

# Show all outputs
terraform output
```

## Notes

- **No VPC creation** - DigitalOcean handles networking automatically
- **In-cluster PostgreSQL** - Using Kubernetes deployment (infra/k8s/base/postgres-deployment.yaml)
- **Auto-scaling** - Enabled for all environments
- **Registry** - Shared across all environments
- **Kubeconfig** - Auto-generated per environment

## Next Steps After Creation

1. Deploy apps: `kubectl apply -k infra/k8s/overlays/dev`
2. Get LoadBalancer IP: `kubectl get svc -n dev`
3. Configure GitHub secrets with cluster info
4. Run CI/CD pipeline
