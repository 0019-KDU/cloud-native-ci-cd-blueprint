# AI Incident & Status Assistant

A **production-grade cloud-native application** for DevOps teams to manage incidents with AI-powered analysis, featuring a complete **GitOps CI/CD pipeline** with multi-stage deployments and enterprise-level security.

## 📦 Related Repositories

- **Infrastructure**: [cloud-native-infrastructure](https://github.com/0019-KDU/cloud-native-infrastructure) - Terraform configs and ArgoCD applications for Kubernetes cluster provisioning

## 🎯 Overview

This application helps DevOps engineers and startups manage incidents by automatically generating:
- **AI Summary** - Concise technical summary powered by OpenAI GPT-4o-mini
- **Root Cause Analysis** - Detailed analysis with likelihood ratings and component mapping
- **Actionable Remediation Steps** - Prioritized action items with owner assignments
- **Customer-Friendly Messages** - Public-facing status messages for status pages
- **Pattern Recognition** - Identify similar past incidents
- **Preventive Measures** - Recommendations to prevent recurrence

## 🚀 Architecture Highlights

✅ **GitOps Multi-Stage Pipeline** - Dev → Staging → Production with approval gates  
✅ **Build Once, Deploy Many** - Immutable Docker images promoted through environments  
✅ **Kubernetes-Native** - Kustomize overlays for environment-specific configs  
✅ **Security-First** - Secret scanning, code quality, vulnerability scanning  
✅ **Production-Ready** - Manual approval gates with automated rollback  
✅ **Automated Testing** - 60 unit tests with 52% coverage + E2E tests in staging  
✅ **Continuous Monitoring** - Health checks, logging, and observability built-in

## Features

- Create incidents with title, severity, and detailed descriptions/logs
- Automatic AI analysis via OpenAI API (GPT-4o-mini)
- Store all incidents and AI analysis in PostgreSQL
- Clean, responsive React UI
- RESTful API built with Express.js

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with `pg` driver)
- **AI**: OpenAI API
- **Language**: JavaScript (ES6+)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Pure CSS
- **Language**: JavaScript (ES6+)

## Project Structure

```
cloud-native-ci-cd-blueprint/
├── backend/                      # Express API server
│   ├── src/
│   │   ├── config/              # Configuration (env, logger)
│   │   ├── db/                  # Database connection & migrations
│   │   ├── services/            # Business logic (AI, incidents)
│   │   ├── controllers/         # HTTP request handlers
│   │   ├── routes/              # API route definitions
│   │   ├── middlewares/         # Express middlewares
│   │   └── index.js             # App entry point
│   ├── package.json
│   └── README.md
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client
│   │   ├── App.jsx              # Main app with routing
│   │   └── main.jsx             # Entry point
│   ├── package.json
│   └── README.md
│
├── infra/
│   ├── k8s/                     # Kubernetes manifests
│   │   ├── base/                # Base deployments, services
│   │   └── overlays/            # Environment-specific configs
│   │       ├── dev/
│   │       └── staging/
│   └── docker/                  # Dockerfiles for backend/frontend
│
├── .github/workflows/           # CI/CD pipelines
│   ├── backend-pipeline.yml     # Backend build, test, deploy
│   └── frontend-pipeline.yml    # Frontend build, test, deploy
│
├── tests/
│   ├── e2e/                     # Playwright E2E tests
│   └── load/                    # K6 load tests
│
├── docs/
│   ├── SETUP_GUIDE.md           # Complete setup instructions
│   └── ci-cd-design.md          # CI/CD design documentation
│
└── README.md                     # This file

**Infrastructure (separate repo):** [cloud-native-infrastructure](https://github.com/0019-KDU/cloud-native-infrastructure)
├── terraform/                    # Kubernetes cluster provisioning
└── argocd/                      # ArgoCD application definitions
```

## Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v13+
- OpenAI API key

### Setup Instructions

📘 **For detailed setup instructions, see [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)**

**Quick version:**

1. **Database Setup**
   ```sql
   CREATE DATABASE incident_assistant;
   -- Run: backend/src/db/migrations/001_create_incidents_table.sql
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env.development
   # Edit .env.development with your DB password and OpenAI key
   npm run dev
   ```

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   cp .env.example .env.development
   # Edit .env.development (set VITE_API_URL=http://localhost:3001)
   npm run dev
   ```

4. **Open in Browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api

## API Endpoints

### Incidents
- `POST /api/incidents` - Create new incident (with AI analysis)
- `GET /api/incidents` - Get all incidents (with pagination)
- `GET /api/incidents/:id` - Get incident by ID
- `GET /api/incidents/severity/:severity` - Get incidents by severity

### Health Check
- `GET /health` - Server health status
- `GET /api` - API information

## Application Flow

1. User creates incident (title, severity, description with error logs)
2. Backend receives request → calls OpenAI API
3. OpenAI analyzes the incident and returns:
   - Summary
   - Root cause suggestions
   - Customer-friendly message
4. Backend saves incident + AI analysis to PostgreSQL
5. Frontend displays the complete incident with AI insights

## Environment Variables

### Backend (`.env.development`)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=incident_assistant
DB_USER=postgres
DB_PASSWORD=your_password
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-4o-mini
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:3001
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Starts server with nodemon (auto-reload)
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server (hot reload)
```

## Database Schema

### `incidents` Table
- `id` - Auto-increment primary key
- `title` - Incident title
- `severity` - Enum: 'low', 'medium', 'high'
- `description` - Full incident description
- `ai_summary` - AI-generated summary
- `ai_root_causes` - JSONB array of root cause suggestions
- `ai_customer_message` - Customer-friendly status message
- `created_at`, `updated_at` - Timestamps

## Screenshots & Usage

### Create Incident
1. Click "Create New Incident"
2. Fill in title, select severity, add description/logs
3. Submit → AI analyzes in a few seconds
4. View complete incident with AI insights

### View Incidents
- List page shows all incidents with severity badges
- Click any incident to view full details
- Copy customer message to clipboard for status pages

## Code Style

- Modern JavaScript (ES6+)
- Async/await for asynchronous operations
- Detailed comments explaining what code does and why
- Separation of concerns: routes → controllers → services → database
- Error handling at all layers

## 🏗️ CI/CD Pipeline

### Multi-Stage GitOps Architecture

```
Feature Branch → PR (Tests Only) → dev → staging → main
                                     ↓      ↓        ↓
                                   Dev    QA    Production
                                  (Auto) (Auto)  (Approval)
```

**Pipeline Stages**:
1. **Secret Scanning** - Gitleaks for exposed secrets
2. **Test & Quality** - Jest (60 tests, 52% coverage) + SonarQube
3. **Build** - Docker multi-stage builds (Backend + Frontend)
4. **Security Scan** - Trivy vulnerability scanning
5. **Push** - DigitalOcean Container Registry
6. **Deploy** - Kubernetes with Kustomize overlays

**Key Features**:
- ✅ Build Once, Deploy Many (immutable artifacts)
- ✅ Progressive deployment: dev → staging → production
- ✅ Approval gates for production (2 reviewers required)
- ✅ Single-region production deployment
- ✅ Automated rollback capability

📖 **Full Pipeline Documentation**: [docs/CICD_ARCHITECTURE.md](docs/CICD_ARCHITECTURE.md)  
📊 **Pipeline Diagram**: [docs/PIPELINE_DIAGRAM.md](docs/PIPELINE_DIAGRAM.md)

### GitHub Actions Workflows

- **Backend Pipeline**: `.github/workflows/backend-pipeline.yml`
- **Frontend Pipeline**: `.github/workflows/frontend-pipeline.yml`

### Kubernetes Deployment

**Includes everything you need**:
- ✅ PostgreSQL 16 database (automatic deployment)
- ✅ Backend API server
- ✅ Frontend React app
- ✅ Ingress with TLS support
- ✅ Persistent storage for database
- ✅ Environment-specific configurations

```bash
# Deploy to dev (includes PostgreSQL)
kubectl apply -k infra/k8s/overlays/dev

# Deploy to staging
kubectl apply -k infra/k8s/overlays/staging

# Deploy to production (with approval)
kubectl apply -k infra/k8s/overlays/production
```

📖 **Kubernetes Guide**: [infra/k8s/README.md](infra/k8s/README.md)  
🔐 **Environment Setup**: [.github/ENVIRONMENTS_SETUP.md](.github/ENVIRONMENTS_SETUP.md)

## 🧪 Testing

### Run Unit Tests
```bash
cd backend
npm test                  # Run all 60 tests
npm run test:watch        # Watch mode
npm run test:ci           # CI mode with coverage
```

**Test Coverage**: 52% (exceeds 50% threshold)  
**Test Suites**: 7 suites, 60 tests

### Test Organization
```
backend/src/__tests__/
├── services/
│   ├── incidents.service.test.js (15 tests)
│   └── ai.service.test.js (9 tests)
├── controllers/
│   └── incidents.controller.test.js (12 tests)
├── middlewares/
│   └── errorHandler.test.js (6 tests)
├── config/
│   ├── env.test.js (4 tests)
│   └── logger.test.js (7 tests)
└── routes/
    └── incidents.routes.test.js (3 tests)
```

## 🐳 Docker

### Production Dockerfiles

**Backend**: `infra/docker/backend.Dockerfile`
- Multi-stage build (dependencies → production)
- Alpine Linux base (minimal size)
- Non-root user (security)
- Health checks

**Frontend**: `infra/docker/frontend.Dockerfile`
- Build stage with Vite
- Nginx production server
- SPA-optimized routing

### Build Locally

```bash
# Backend
docker build -f infra/docker/backend.Dockerfile -t backend .

# Frontend
docker build -f infra/docker/frontend.Dockerfile -t frontend .
```

## 📊 Monitoring & Observability

- **Health Checks**: `/health` endpoints with liveness/readiness probes
- **Logging**: Centralized logging with Winston
- **Metrics**: Application metrics collection ready
- **Tracing**: OpenTelemetry compatible

## 🔐 Security

### Security Layers
1. **Secret Scanning** - Gitleaks prevents secret leaks
2. **Code Quality** - SonarQube static analysis
3. **Vulnerability Scanning** - Trivy for container security
4. **SARIF Upload** - GitHub Security integration
5. **Non-root Containers** - Security best practices
6. **Environment Protection** - GitHub approval gates

## 📖 Documentation

- 📘 [Setup Guide](docs/SETUP_GUIDE.md) - Complete setup instructions
- 🏗️ [CI/CD Architecture](docs/CICD_ARCHITECTURE.md) - Pipeline deep dive
- 📊 [Pipeline Diagram](docs/PIPELINE_DIAGRAM.md) - Visual reference
- 🔐 [Secrets Setup](.github/SECRETS_SETUP.md) - GitHub secrets configuration
- 🌐 [Environments Setup](.github/ENVIRONMENTS_SETUP.md) - Deployment environments
- 🎯 [API Specification](docs/api-spec.md) - API endpoints
- 🏛️ [Architecture](docs/architecture.md) - System architecture
- ☸️ [Kubernetes Guide](infra/k8s/README.md) - K8s deployment

## 🎓 Learning Resources

This project demonstrates **production-grade DevOps practices**:

### Application Development
- Full-stack TypeScript/JavaScript development
- RESTful API design with Express.js
- React SPA with modern hooks
- PostgreSQL database design
- OpenAI API integration

### DevOps & Cloud Native
- Docker multi-stage builds
- Kubernetes deployment strategies
- GitOps with ArgoCD/Flux
- Kustomize for environment management
- Progressive deployment patterns

### CI/CD & Automation
- GitHub Actions workflows
- Progressive deployment (dev → staging → prod)
- Automated testing (unit, integration, E2E)
- Security scanning (secrets, code, containers)
- Approval workflows

### Monitoring & Reliability
- Health check patterns
- Logging best practices
- Metrics collection
- Incident management workflows

## 🚀 Future Enhancements

- [ ] Implement ArgoCD for automated GitOps sync
- [ ] Add Prometheus + Grafana monitoring
- [ ] Implement blue-green deployment strategy
- [ ] Add canary deployments with progressive traffic shifting
- [ ] Integrate with PagerDuty for alerting
- [ ] Add Slack notifications for deployments
- [ ] Implement feature flags
- [ ] Add user authentication (OAuth2/OIDC)
- [ ] Create analytics dashboard
- [ ] Add incident timeline visualization

## 📄 License

MIT

## 👥 Contributing

Contributions welcome! Please read the contribution guidelines first.

## 📞 Support

- 📖 Documentation: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/0019-KDU/cloud-native-ci-cd-blueprint/discussions)

---

**Architecture Version**: 2.0 (GitOps Multi-Stage)  
**Last Updated**: December 3, 2025  
**Maintained by**: DevOps94
