# Docker Deployment Guide

## 📦 Production-Grade Docker Setup

This directory contains production-ready Docker configurations for the AI Incident Assistant application.

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  Port 8080 (Nginx + React)
│   (Nginx)       │
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend       │  Port 3001 (Node.js)
│   (Node.js)     │
└────────┬────────┘
         │
┌────────▼────────┐
│   PostgreSQL    │  Port 5432
│   (Database)    │
└─────────────────┘
```

## 📁 Files

- **backend.Dockerfile** - Multi-stage Node.js backend with Alpine Linux
- **frontend.Dockerfile** - Multi-stage React build with Nginx
- **nginx.conf** - Production Nginx configuration for SPA
- **docker-compose.yml** - Full stack orchestration
- **.env.example** - Environment variables template

## 🚀 Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### 1. Setup Environment
```bash
cd infra/docker
cp .env.example .env
# Edit .env with your values
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Verify Services
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Health checks
curl http://localhost:8080/health  # Frontend
curl http://localhost:3001/health  # Backend
```

### 4. Access Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Database**: localhost:5432

## 🔧 Individual Service Build

### Backend
```bash
# Build
docker build -f infra/docker/backend.Dockerfile -t ai-incident-backend:latest .

# Run
docker run -d \
  --name incident-backend \
  -p 3001:3001 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_NAME=incident_assistant \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  -e OPENAI_API_KEY=sk-your-key \
  ai-incident-backend:latest
```

### Frontend
```bash
# Build
docker build -f infra/docker/frontend.Dockerfile -t ai-incident-frontend:latest .

# Run
docker run -d \
  --name incident-frontend \
  -p 8080:8080 \
  ai-incident-frontend:latest
```

## 🏭 Production Features

### Backend Dockerfile
✅ **Multi-stage build** - Separate dependency and runtime stages  
✅ **Alpine Linux** - Minimal image size (~150MB)  
✅ **Non-root user** - Security best practice  
✅ **dumb-init** - Proper signal handling  
✅ **Health checks** - Kubernetes-ready  
✅ **Production dependencies only** - No dev packages  
✅ **Layer caching** - Fast rebuilds  

### Frontend Dockerfile
✅ **Multi-stage build** - Build and runtime separation  
✅ **Nginx Alpine** - Lightweight web server (~50MB)  
✅ **Static file optimization** - Gzip, caching headers  
✅ **SPA routing** - React Router support  
✅ **Security headers** - XSS, CSRF protection  
✅ **Non-root user** - nginx user  
✅ **Health checks** - Liveness probes  

### Docker Compose
✅ **Service orchestration** - All components together  
✅ **Health checks** - Automatic dependency management  
✅ **Volume persistence** - Database data retention  
✅ **Network isolation** - Private bridge network  
✅ **Logging configuration** - Log rotation  
✅ **Restart policies** - Automatic recovery  

## 📊 Image Sizes

| Image | Size | Layers |
|-------|------|--------|
| Backend | ~150MB | 12 |
| Frontend | ~50MB | 8 |
| PostgreSQL | ~240MB | - |

## 🔍 Troubleshooting

### Check Container Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Enter Container Shell
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres psql -U postgres -d incident_assistant
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Check Health Status
```bash
docker-compose ps
```

### Database Issues

**Reset Database:**
```bash
docker-compose down -v  # ⚠️ Deletes all data
docker-compose up -d
```

**Run Migrations:**
```bash
docker-compose exec backend node run-migration.js
```

**Database Backup:**
```bash
docker-compose exec postgres pg_dump -U postgres incident_assistant > backup.sql
```

**Database Restore:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d incident_assistant
```

## 🔒 Security Best Practices

### ✅ Implemented
- Non-root users in containers
- Minimal base images (Alpine)
- No secrets in Dockerfiles
- Security headers in Nginx
- Read-only file systems where possible
- Health checks for all services
- Network isolation

### 🔐 Environment Variables
**Never commit:**
- `.env` files
- API keys
- Database passwords

**Use secrets management in production:**
- Docker Secrets
- Kubernetes Secrets
- AWS Secrets Manager
- HashiCorp Vault

## 🚢 Deployment

### Docker Swarm
```bash
docker stack deploy -c docker-compose.yml incident-assistant
```

### Kubernetes
```bash
# Convert docker-compose to Kubernetes manifests
kompose convert -f docker-compose.yml

# Apply to cluster
kubectl apply -f ./
```

### Cloud Platforms

**AWS ECS:**
```bash
# Use AWS Copilot
copilot init
copilot deploy
```

**Azure Container Instances:**
```bash
az container create \
  --resource-group myResourceGroup \
  --file docker-compose.yml
```

**Google Cloud Run:**
```bash
gcloud run deploy incident-backend \
  --image gcr.io/project/ai-incident-backend \
  --platform managed
```

## 📈 Monitoring

### Container Stats
```bash
docker stats
```

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- name: Build Backend
  run: docker build -f infra/docker/backend.Dockerfile -t backend:${{ github.sha }} .

- name: Push to Registry
  run: docker push backend:${{ github.sha }}
```

### GitLab CI
```yaml
build:backend:
  script:
    - docker build -f infra/docker/backend.Dockerfile -t $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE/backend:$CI_COMMIT_SHA
```

## 🧹 Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove with volumes (⚠️ deletes data)
docker-compose down -v

# Remove images
docker rmi ai-incident-backend:latest
docker rmi ai-incident-frontend:latest

# Clean all Docker resources
docker system prune -a --volumes
```

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

## 🆘 Support

For issues or questions:
1. Check container logs
2. Verify environment variables
3. Review Docker documentation
4. Check application logs inside containers

---

**Last Updated**: November 30, 2025  
**Docker Version**: 24.0+  
**Compose Version**: 2.0+
