# Fixing GitHub Actions Network Connectivity Issues

## Problem
GitHub Actions workflows fail to connect to staging environment with error:
```
❌ Staging failed to become ready
Error: Process completed with exit code 1.
```

## Root Cause
GitHub-hosted runners cannot reach your DigitalOcean Kubernetes cluster at `staging.174.138.120.13.nip.io` due to network restrictions.

## Solutions (Choose One)

---

### Solution 1: Use Self-Hosted Runner ⭐ RECOMMENDED

**Pros:**
- Full access to your network
- Faster execution (no network latency)
- More control over environment

**Cons:**
- Requires maintaining a server
- Additional infrastructure cost

**Setup:**
1. Go to: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/settings/actions/runners/new
2. Follow instructions to install runner on a server that can access your cluster
3. Update workflows to use `runs-on: self-hosted`

See: `docs/GITHUB_RUNNER_SETUP.md` for detailed instructions

---

### Solution 2: Expose Cluster to Internet (Current Issue)

**Check if ingress-nginx is properly exposed:**

```bash
# Connect to your cluster
doctl kubernetes cluster kubeconfig save k8s-1-31-1-do-0-blr1-1733571697683

# Check ingress controller service
kubectl get svc -n ingress-nginx

# Expected output should show EXTERNAL-IP
NAME                                 TYPE           EXTERNAL-IP        PORT(S)
ingress-nginx-controller            LoadBalancer   174.138.120.13     80:30080/TCP,443:30443/TCP
```

**If EXTERNAL-IP is pending or missing:**

```bash
# Check LoadBalancer status
kubectl describe svc ingress-nginx-controller -n ingress-nginx

# Check DigitalOcean Load Balancer
doctl compute load-balancer list
```

**Test from outside your network:**

```bash
# Use a public service to test connectivity
curl -I https://dnschecker.org/curl.php?url=http://staging.174.138.120.13.nip.io/api
```

---

### Solution 3: Temporary Workaround - Skip Health Check

**For immediate testing, modify workflow to skip connectivity check:**

```yaml
# .github/workflows/staging-validation.yml
smoke-test:
  runs-on: ubuntu-latest
  steps:
    - name: Wait for staging to be ready
      run: |
        echo "⚠️ Skipping connectivity check (self-hosted runner required)"
        echo "✅ Assuming staging is ready"
```

**Note:** This only works for testing workflow syntax, not actual validation.

---

### Solution 4: Use VPN/Tailscale

**If your cluster is on a private network:**

1. Install Tailscale on your cluster nodes
2. Set up Tailscale in GitHub Actions:
```yaml
- name: Connect to Tailscale
  uses: tailscale/github-action@v2
  with:
    oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
    oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
    tags: tag:ci

- name: Test staging
  run: curl http://staging.internal/api
```

---

## Recommended Approach

**For production CI/CD pipeline, use Self-Hosted Runner:**

1. **Setup runner on DigitalOcean droplet** (see GITHUB_RUNNER_SETUP.md)
2. **Update both workflows:**

```yaml
# staging-validation.yml
jobs:
  smoke-test:
    runs-on: self-hosted  # Changed from ubuntu-latest
    
  e2e-test:
    runs-on: self-hosted
    
  load-test:
    runs-on: self-hosted
```

```yaml
# production-deployment.yml
jobs:
  post-deployment-smoke:
    runs-on: self-hosted  # Changed from ubuntu-latest
```

3. **Keep ci-pipeline.yml using `ubuntu-latest`** (for building Docker images)

---

## Quick Diagnostic Commands

```bash
# From your local machine
curl -v http://staging.174.138.120.13.nip.io/api

# Check if port 80 is open
Test-NetConnection -ComputerName 174.138.120.13 -Port 80

# Check DNS resolution
nslookup staging.174.138.120.13.nip.io

# Test from GitHub Actions (create test workflow)
curl -v --connect-timeout 10 http://staging.174.138.120.13.nip.io/api
```

---

## Next Steps

1. **Immediate:** Set up self-hosted runner (15 minutes)
2. **Test:** Run staging validation workflow with self-hosted runner
3. **Verify:** Check that all tests pass
4. **Document:** Update TESTING_GUIDE.md with runner instructions
