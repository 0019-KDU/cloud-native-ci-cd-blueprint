# AI Incident Assistant - Frontend

React (Vite) frontend for the AI Incident & Status Assistant application.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS (no framework, pure CSS)
- **HTTP Client**: Fetch API

## Project Structure

```
frontend/
├── src/
│   ├── pages/                      # Page components
│   │   ├── IncidentsListPage.jsx   # List all incidents
│   │   ├── IncidentDetailPage.jsx  # View incident details
│   │   └── NewIncidentPage.jsx     # Create new incident
│   ├── components/                 # Reusable components (add as needed)
│   ├── services/                   # API integration
│   │   ├── apiClient.js            # Base HTTP client
│   │   └── incidentsApi.js         # Incidents API functions
│   ├── App.jsx                     # Main app with routing
│   ├── App.css                     # Global app styles
│   └── main.jsx                    # Entry point
├── .env.development                # Your local env vars (create this!)
├── .env.example                    # Template for env vars
├── package.json
├── vite.config.js
└── README.md
```

## Features

### Pages

1. **Incidents List Page** (`/`)
   - Shows all incidents in a table
   - Color-coded severity badges
   - Links to detail pages
   - "Create New Incident" button

2. **Incident Detail Page** (`/incidents/:id`)
   - Full incident details
   - AI-generated summary
   - Root cause suggestions
   - Customer-friendly message (with copy-to-clipboard)

3. **New Incident Page** (`/incidents/new`)
   - Form to create incidents
   - Real-time validation
   - Loading state during AI analysis
   - Auto-redirects to detail page on success

## Setup Instructions

See the main project README for complete setup instructions.

### Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.development` from `.env.example`:
   ```bash
   cp .env.example .env.development
   ```

3. Edit `.env.development` and set:
   ```
   VITE_API_URL=http://localhost:3001
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open browser to http://localhost:5173

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables

See `.env.example` for all available options.

**Required:**
- `VITE_API_URL` - Backend API URL (e.g., http://localhost:3001)

**Note:** Vite only exposes environment variables that start with `VITE_` to the frontend code.

## Development

Vite provides:
- Hot Module Replacement (HMR) - instant updates when you save files
- Fast cold starts
- Optimized builds

The dev server runs on port 5173 by default.

## API Integration

The frontend communicates with the backend via REST API:
- `GET /api/incidents` - Fetch all incidents
- `GET /api/incidents/:id` - Fetch one incident
- `POST /api/incidents` - Create new incident

All API calls go through the `apiClient` service, which:
- Adds the base URL from environment
- Sets Content-Type headers
- Handles errors consistently
- Parses JSON responses
