# AI Incident & Status Assistant

A full-stack application for DevOps teams to manage incidents with AI-powered analysis using OpenAI.

## Overview

This application helps DevOps engineers and startups manage incidents by automatically generating:
- **AI Summary** - Concise technical summary of the incident
- **Root Cause Suggestions** - 2-3 possible causes based on error logs
- **Customer-Friendly Messages** - Public-facing status messages for status pages

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
│   ├── .env.development         # Backend environment variables (create from .env.example)
│   ├── package.json
│   └── README.md
│
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── services/            # API client
│   │   ├── App.jsx              # Main app with routing
│   │   └── main.jsx             # Entry point
│   ├── .env.development         # Frontend environment variables (create from .env.example)
│   ├── package.json
│   └── README.md
│
├── docs/
│   ├── SETUP_GUIDE.md           # Complete setup instructions
│   └── ci-cd-design.md          # CI/CD design documentation
│
└── README.md                     # This file
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

## Learning Resources

This project is designed for learning. Key concepts demonstrated:

- **Backend**
  - Express.js middleware pattern
  - PostgreSQL connection pooling
  - Service layer architecture
  - Error handling middleware
  - OpenAI API integration
  - Environment variable management

- **Frontend**
  - React Hooks (useState, useEffect)
  - React Router for SPA navigation
  - API integration with fetch
  - Form handling and validation
  - Loading and error states

## Future Enhancements

Potential features to add:
- User authentication
- Incident updates and status changes
- Comments/notes on incidents
- Incident search and filtering
- Email notifications
- Integration with monitoring tools (Datadog, New Relic)
- Incident analytics dashboard

## License

MIT

## Author

DevOps94

---

**Need Help?** Check [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md) for detailed setup instructions.
