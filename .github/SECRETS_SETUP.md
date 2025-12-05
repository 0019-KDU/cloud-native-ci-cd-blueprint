# GitHub Actions Secrets Configuration

## Required Secrets

Configure these secrets in your GitHub repository:  
**Settings → Secrets and variables → Actions → New repository secret**

### 1. DigitalOcean Container Registry

#### `DO_REGISTRY`
- **Description**: DigitalOcean Container Registry URL
- **Format**: `registry.digitalocean.com/<your-registry-name>`
- **Example**: `registry.digitalocean.com/ai-incident-assistant`
- **How to get**:
  1. Go to DigitalOcean Dashboard
  2. Navigate to Container Registry
  3. Create a registry if you don't have one
  4. Copy the registry URL

#### `DO_REGISTRY_TOKEN`
- **Description**: DigitalOcean Personal Access Token (PAT)
- **Format**: `dop_v1_xxxxxxxxxxxx`
- **How to get**:
  1. Go to DigitalOcean Dashboard
  2. Navigate to API → Tokens/Keys
  3. Generate New Token
  4. Name: `github-actions-ci-cd`
  5. Scopes: Check "Read" and "Write" for Container Registry
  6. Copy the token (shown only once)

### 2. SonarQube/SonarCloud

#### `SONAR_TOKEN`
- **Description**: SonarQube authentication token
- **Format**: `sqp_xxxxxxxxxxxx` (SonarCloud) or your SonarQube token
- **How to get (SonarCloud)**:
  1. Go to https://sonarcloud.io
  2. My Account → Security
  3. Generate Tokens
  4. Name: `github-actions`
  5. Type: User Token
  6. Copy the token

- **How to get (Self-hosted SonarQube)**:
  1. Go to your SonarQube instance
  2. My Account → Security → Generate Tokens
  3. Copy the token

#### `SONAR_HOST_URL`
- **Description**: SonarQube server URL
- **SonarCloud**: `https://sonarcloud.io`
- **Self-hosted**: `https://your-sonarqube-instance.com`

### 3. Optional Secrets

#### `GITLEAKS_LICENSE`
- **Description**: Gitleaks Pro license (optional, for advanced features)
- **Free tier**: Not required, basic scanning works without license
- **How to get**: Purchase from https://gitleaks.io

#### `VITE_API_URL`
- **Description**: Backend API URL for frontend build
- **Default**: `http://localhost:3001`
- **Production**: `https://api.yourdomain.com`

#### `CODECOV_TOKEN`
- **Description**: Codecov upload token (optional, for coverage reports)
- **How to get**:
  1. Go to https://codecov.io
  2. Add your repository
  3. Copy the upload token

---

## Setting Up Secrets

### Step-by-Step Guide

1. **Navigate to Repository Settings**
   ```
   GitHub Repository → Settings → Secrets and variables → Actions
   ```

2. **Click "New repository secret"**

3. **Add Each Secret**
   - Name: Enter the exact secret name (e.g., `DO_REGISTRY`)
   - Secret: Paste the value
   - Click "Add secret"

4. **Verify Secrets**
   - Secrets list should show all configured secrets
   - Values are hidden after creation

---

## SonarQube Project Setup

### For SonarCloud

1. **Import Repository**
   - Go to https://sonarcloud.io
   - Click "+" → Analyze new project
   - Select your GitHub organization/repo
   - Choose "With GitHub Actions"

2. **Configure Projects**
   - Backend project key: `ai-incident-backend`
   - Frontend project key: `ai-incident-frontend`

3. **Organization Key**
   - Note your organization key (needed for sonar-project.properties)

### For Self-hosted SonarQube

1. **Create Projects**
   ```bash
   # Via UI or API
   Backend: ai-incident-backend
   Frontend: ai-incident-frontend
   ```

2. **Generate Token**
   - Admin → Security → Users → Tokens
   - Create token for GitHub Actions

---

## DigitalOcean Container Registry Setup

### 1. Create Registry

```bash
# Via DigitalOcean CLI
doctl registry create ai-incident-assistant --region nyc3

# Or use the web UI
# Dashboard → Container Registry → Create
```

### 2. Configure Access

```bash
# Login locally to test
doctl registry login

# Generate read/write token
doctl auth init
```

### 3. Registry Structure

After pipeline runs, your registry will contain:

```
registry.digitalocean.com/ai-incident-assistant/
├── backend:latest
├── backend:main-abc1234
├── backend:20251130-120000
├── frontend:latest
├── frontend:main-def5678
└── frontend:20251130-120000
```

---

## Verification Checklist

- [ ] `DO_REGISTRY` - DigitalOcean registry URL configured
- [ ] `DO_REGISTRY_TOKEN` - DigitalOcean PAT with registry write access
- [ ] `SONAR_TOKEN` - SonarQube/SonarCloud token configured
- [ ] `SONAR_HOST_URL` - SonarQube host URL configured
- [ ] Backend SonarQube project created (`ai-incident-backend`)
- [ ] Frontend SonarQube project created (`ai-incident-frontend`)
- [ ] DigitalOcean Container Registry created
- [ ] Test pipeline by pushing to `develop` branch

---

## Testing the Pipeline

### 1. Test Secret Scanning (Gitleaks)

```bash
git checkout -b test/pipeline
echo "password=secret123" > test.txt
git add test.txt
git commit -m "test: trigger secret scan"
git push origin test/pipeline
```

Should fail with secret detection warning.

### 2. Test Full Pipeline

```bash
# Make a real change
git checkout -b feature/test-pipeline
# Modify backend or frontend
git add .
git commit -m "feat: test CI/CD pipeline"
git push origin feature/test-pipeline
```

Create PR to `main` branch and watch pipeline run.

### 3. Monitor Pipeline

- GitHub Actions → Select workflow run
- Check each job status
- Review logs for any failures
- Verify image pushed to DigitalOcean registry

---

## Common Issues & Solutions

### Issue: `DO_REGISTRY_TOKEN` invalid

**Solution**:
- Regenerate DigitalOcean PAT
- Ensure "Write" scope for Container Registry
- Update secret in GitHub

### Issue: SonarQube quality gate fails

**Solution**:
- Check code coverage meets threshold (80%)
- Fix code smells and bugs reported
- Review SonarQube dashboard

### Issue: Trivy finds vulnerabilities

**Solution**:
- Update base Docker images
- Update npm dependencies: `npm audit fix`
- Review and suppress false positives

### Issue: Gitleaks finds secrets

**Solution**:
- Remove secrets from code
- Use environment variables
- Add to `.gitleaksignore` if false positive
- Rotate exposed secrets immediately

---

## Security Best Practices

1. **Never commit secrets**
   - Use GitHub Secrets for all sensitive data
   - Add `.env` to `.gitignore`

2. **Rotate tokens regularly**
   - DigitalOcean PAT: Every 90 days
   - SonarQube token: Every 90 days

3. **Minimal permissions**
   - DigitalOcean PAT: Only Container Registry access
   - SonarQube token: Only project scope

4. **Monitor pipeline**
   - Enable GitHub Actions notifications
   - Review security scan results
   - Act on vulnerability reports

---

## Pipeline Triggers

### Backend Pipeline
- **Triggers on**:
  - Push to `main` or `develop` branch
  - Changes in `backend/**` directory
  - Changes in backend pipeline file

### Frontend Pipeline
- **Triggers on**:
  - Push to `main` or `develop` branch
  - Changes in `frontend/**` directory
  - Changes in frontend pipeline file

### What Happens
1. **PR to main/develop**: Runs tests, scans, builds (no push)
2. **Merge to develop**: Runs full pipeline, pushes develop images
3. **Merge to main**: Runs full pipeline, pushes production images with `:latest` tag

---

## Pipeline Architecture

```
┌─────────────┐
│ Secret Scan │  Gitleaks
└──────┬──────┘
       │
┌──────▼──────┐
│    Test     │  Jest/ESLint + Coverage
└──────┬──────┘
       │
┌──────▼──────┐
│   SonarQube │  Code Quality
└──────┬──────┘
       │
┌──────▼──────┐
│    Build    │  Docker Image
└──────┬──────┘
       │
┌──────▼──────┐
│ Trivy Scan  │  Vulnerability Scan
└──────┬──────┘
       │
┌──────▼──────┐
│    Push     │  To DO Registry
└─────────────┘
```

---

## Support

For issues:
1. Check GitHub Actions logs
2. Review this configuration guide
3. Verify all secrets are set correctly
4. Test DigitalOcean CLI access locally
5. Verify SonarQube project configuration
