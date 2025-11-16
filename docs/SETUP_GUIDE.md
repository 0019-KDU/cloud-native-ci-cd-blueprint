# AI Incident Assistant - Complete Setup Guide

This guide will walk you through setting up and running the AI Incident & Status Assistant application on your local machine.

## Prerequisites

Before you begin, make sure you have these installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** (v13 or higher)
   - You mentioned you have this installed and use pgAdmin
   - Verify: `psql --version`

3. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

4. **OpenAI API Key**
   - Sign up at: https://platform.openai.com/
   - Create API key at: https://platform.openai.com/api-keys
   - Keep this key secure!

## Project Overview

```
cloud-native-ci-cd-blueprint/
├── backend/          # Express API server (Node.js)
├── frontend/         # React frontend (Vite)
└── docs/            # Documentation
```

---

## STEP 1: Database Setup

### 1.1 Create Database

Open pgAdmin (or use psql command line):

**Option A: Using pgAdmin**
1. Right-click on "Databases"
2. Select "Create" → "Database..."
3. Name: `incident_assistant`
4. Owner: `postgres` (or your preferred user)
5. Click "Save"

**Option B: Using psql command line**
```sql
CREATE DATABASE incident_assistant;
```

### 1.2 Run Migrations

1. In pgAdmin, right-click on `incident_assistant` database
2. Select "Query Tool"
3. Open the file: `backend/src/db/migrations/001_create_incidents_table.sql`
4. Run the SQL script (press F5 or click Execute)

**Or using psql:**
```bash
psql -U postgres -d incident_assistant -f backend/src/db/migrations/001_create_incidents_table.sql
```

### 1.3 Verify Table Creation

Run this query to verify:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

You should see the `incidents` table listed.

---

## STEP 2: Backend Setup

### 2.1 Install Dependencies

Open terminal and navigate to the backend folder:

```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `pg` - PostgreSQL client
- `openai` - OpenAI API client
- `cors` - Enable cross-origin requests
- `dotenv` - Load environment variables
- `nodemon` - Auto-restart server during development

### 2.2 Create Environment File

Copy the example file:
```bash
cp .env.example .env.development
```

Or on Windows:
```bash
copy .env.example .env.development
```

### 2.3 Configure Environment Variables

Open `backend/.env.development` in a text editor and fill in your values:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=incident_assistant
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE    # <-- CHANGE THIS!

# OpenAI Configuration
OPENAI_API_KEY=sk-YOUR_OPENAI_API_KEY_HERE  # <-- CHANGE THIS!
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Important:** Replace `YOUR_POSTGRES_PASSWORD_HERE` and `sk-YOUR_OPENAI_API_KEY_HERE` with your actual values!

### 2.4 Test Backend

Start the backend server:
```bash
npm run dev
```

You should see output like:
```
[INFO] 🚀 Starting AI Incident Assistant API...
[INFO] Testing database connection...
[SUCCESS] ✅ Database connected successfully
[SUCCESS] ✅ Server running on http://localhost:3001
```

Test in your browser:
- Open: http://localhost:3001/health
- You should see: `{"status":"ok","timestamp":"...","uptime":...}`

**If you see errors:**
- Database connection failed → Check DB_PASSWORD and PostgreSQL is running
- OpenAI error → Check OPENAI_API_KEY is correct

Keep the backend server running (don't close this terminal).

---

## STEP 3: Frontend Setup

### 3.1 Install Dependencies

Open a **NEW terminal** (keep backend running in the first one):

```bash
cd frontend
npm install
```

This will install:
- `react` - UI framework
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing
- `vite` - Build tool and dev server

### 3.2 Create Environment File

```bash
cp .env.example .env.development
```

Or on Windows:
```bash
copy .env.example .env.development
```

### 3.3 Configure Environment Variables

Open `frontend/.env.development` and set:

```env
VITE_API_URL=http://localhost:3001
```

**Note:** The `VITE_` prefix is required for Vite to expose this variable to the browser.

### 3.4 Start Frontend

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## STEP 4: Test the Application

### 4.1 Open the App

Open your browser to: **http://localhost:5173/**

You should see:
- Header: "AI Incident Assistant"
- Empty incidents list (since you haven't created any yet)
- "Create New Incident" button

### 4.2 Create Your First Incident

1. Click **"Create New Incident"**
2. Fill in the form:
   - **Title**: "Database connection timeout"
   - **Severity**: High
   - **Description**:
     ```
     PostgreSQL connection pool is exhausted. Error logs show:
     ERROR: connection timeout after 5000ms
     DETAIL: All 20 connections in pool are active
     TIME: 2025-01-15 14:30:22 UTC
     SERVICE: api-gateway
     ```
3. Click **"Create Incident"**
4. Wait a few seconds (while AI analyzes)
5. You'll be redirected to the incident detail page

### 4.3 Verify AI Analysis

On the detail page, you should see:
- **AI Summary**: A concise technical summary of the issue
- **Possible Root Causes**: 2-3 suggestions (e.g., "Connection pool configuration too small", "Memory leak not releasing connections")
- **Customer-Friendly Message**: A public-facing status message

### 4.4 Test Other Features

- Click **"Back to Incidents"** → Should show your incident in the table
- Click on the incident title → Should navigate to detail page
- Try the **"Copy to Clipboard"** button on the customer message
- Create more incidents with different severities

---

## STEP 5: Understanding the Flow

Here's what happens when you create an incident:

```
1. User fills form in NewIncidentPage.jsx
   ↓
2. Form submits → calls createIncident() in incidentsApi.js
   ↓
3. POST /api/incidents → hits backend route in incidents.routes.js
   ↓
4. Controller (incidents.controller.js) → calls incidents.service.js
   ↓
5. Service calls ai.service.js → sends request to OpenAI API
   ↓
6. OpenAI returns: summary, root causes, customer message
   ↓
7. Service saves everything to PostgreSQL database
   ↓
8. Response flows back through controller → routes → frontend
   ↓
9. Frontend redirects to IncidentDetailPage.jsx with the new incident
```

---

## STEP 6: Project Structure Explained

### Backend Structure

```
backend/src/
├── config/
│   ├── env.js          # Loads environment variables
│   └── logger.js       # Logging utility (colors, timestamps)
├── db/
│   ├── index.js        # PostgreSQL connection pool
│   └── migrations/     # SQL migration scripts
├── services/
│   ├── ai.service.js        # OpenAI integration
│   └── incidents.service.js # Business logic for incidents
├── controllers/
│   └── incidents.controller.js  # HTTP request handlers
├── routes/
│   └── incidents.routes.js      # API endpoint definitions
├── middlewares/
│   └── errorHandler.js          # Global error handling
└── index.js            # Express app entry point
```

**Request Flow:** Routes → Controller → Service → Database

### Frontend Structure

```
frontend/src/
├── pages/
│   ├── IncidentsListPage.jsx     # Home page (list of incidents)
│   ├── IncidentDetailPage.jsx    # Detail view for one incident
│   └── NewIncidentPage.jsx       # Create incident form
├── services/
│   ├── apiClient.js              # Base HTTP client (fetch wrapper)
│   └── incidentsApi.js           # Incidents API functions
├── App.jsx             # Router and layout
└── main.jsx            # React entry point
```

---

## STEP 7: Development Workflow

### Making Changes

**Backend Changes:**
1. Edit files in `backend/src/`
2. Nodemon auto-restarts the server
3. Check terminal for errors
4. Test API in browser or Postman

**Frontend Changes:**
1. Edit files in `frontend/src/`
2. Vite hot-reloads automatically
3. See changes instantly in browser
4. Check browser console for errors

### Stopping the Servers

- Backend: Press `Ctrl+C` in backend terminal
- Frontend: Press `Ctrl+C` in frontend terminal

### Restarting

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

---

## STEP 8: Common Issues & Solutions

### Backend won't start

**Error: "OPENAI_API_KEY is required"**
- Solution: Add your OpenAI API key to `backend/.env.development`

**Error: "Failed to connect to database"**
- Solution: Check PostgreSQL is running
- Verify `DB_PASSWORD` in `.env.development` is correct
- Ensure database `incident_assistant` exists

**Error: "Port 3001 is already in use"**
- Solution: Kill the process using port 3001 or change PORT in `.env.development`

### Frontend issues

**Blank page or errors in console**
- Check: Is backend running on http://localhost:3001?
- Check: Is `VITE_API_URL` set in `frontend/.env.development`?
- Open browser DevTools (F12) → Console tab for errors

**"Failed to fetch" errors**
- Backend is not running or crashed
- CORS issue: Check backend `CORS_ORIGIN` matches frontend URL

### AI analysis fails

**Error creating incident**
- Check OpenAI API key is valid
- Check you have credits in your OpenAI account
- Backend logs will show the error details

---

## STEP 9: Next Steps

Now that you have the app running, you can:

1. **Experiment with different incidents**
   - Try different severities
   - Include real error logs
   - See how AI analysis varies

2. **Explore the code**
   - Read the comments in each file
   - Follow the data flow from frontend → backend → database
   - Understand how each layer works

3. **Customize the application**
   - Add more fields to incidents
   - Create additional API endpoints
   - Improve the UI styling

4. **Learn more**
   - React Router documentation
   - Express.js best practices
   - PostgreSQL query optimization
   - OpenAI API advanced features

---

## Quick Reference

### Terminal Commands

```bash
# Backend
cd backend
npm install          # Install dependencies
npm run dev          # Start dev server with auto-reload
npm start            # Start production server

# Frontend
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
```

### Important URLs

- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **API Docs**: http://localhost:3001/api

### Environment Files

- `backend/.env.development` - Backend config (DB, OpenAI key)
- `frontend/.env.development` - Frontend config (API URL)

**Never commit these files to Git!** They're in `.gitignore`.

---

## Support

If you encounter issues:
1. Check the error messages in terminal
2. Check browser console (F12)
3. Review this guide
4. Check the README files in backend/ and frontend/
5. Review the inline code comments

Happy coding! 🚀
