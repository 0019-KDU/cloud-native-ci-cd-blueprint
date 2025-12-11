# GitHub Self-Hosted Runner Setup

## Why Self-Hosted Runner?

GitHub-hosted runners cannot access your DigitalOcean cluster if it's behind a firewall or private network. A self-hosted runner running in your network can access staging/production environments.

## Setup Steps

### 1. Install Runner on DigitalOcean Droplet

```bash
# SSH to your DO cluster or a separate droplet
ssh root@174.138.120.13

# Create a user for the runner
useradd -m -s /bin/bash github-runner
cd /home/github-runner

# Download the runner (check for latest version at https://github.com/actions/runner/releases)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf actions-runner-linux-x64-2.311.0.tar.gz

# Get token from: https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/settings/actions/runners/new
./config.sh --url https://github.com/0019-KDU/cloud-native-ci-cd-blueprint --token YOUR_TOKEN_HERE

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### 2. Update Workflow to Use Self-Hosted Runner

```yaml
jobs:
  smoke-test:
    runs-on: self-hosted  # Changed from ubuntu-latest
    steps:
      - name: Health check
        run: |
          curl -f http://staging.174.138.120.13.nip.io/api
```

### 3. Install Dependencies on Runner

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y curl git nodejs npm

# Install Playwright
npm install -g playwright
playwright install --with-deps

# Install k6
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## Security Considerations

- Runner has network access to your cluster
- Use firewall rules to restrict runner's access
- Regularly update runner software
- Monitor runner logs
