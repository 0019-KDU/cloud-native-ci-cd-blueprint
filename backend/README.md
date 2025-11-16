# AI Incident Assistant - Backend

Express.js API server that manages incidents and integrates with OpenAI for intelligent analysis.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with `pg` driver)
- **AI**: OpenAI API (GPT-4o-mini)
- **Environment**: dotenv for configuration

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration and environment variables
│   │   ├── env.js        # Environment variable loader
│   │   └── logger.js     # Logging utility
│   ├── db/              # Database layer
│   │   ├── index.js     # PostgreSQL connection pool
│   │   └── migrations/  # SQL migration files
│   ├── services/        # Business logic
│   │   ├── ai.service.js        # OpenAI integration
│   │   └── incidents.service.js # Incident operations
│   ├── controllers/     # HTTP request handlers
│   │   └── incidents.controller.js
│   ├── routes/          # API routes
│   │   └── incidents.routes.js
│   ├── middlewares/     # Express middlewares
│   │   └── errorHandler.js
│   └── index.js         # Application entry point
├── .env.development     # Your local environment variables (create this!)
├── .env.example         # Template for environment variables
├── package.json
└── README.md
```

## API Endpoints

### Incidents

- `POST /api/incidents` - Create new incident with AI analysis
- `GET /api/incidents` - Get all incidents (with pagination)
- `GET /api/incidents/:id` - Get specific incident
- `GET /api/incidents/severity/:severity` - Get incidents by severity

### Health Check

- `GET /health` - Server health status
- `GET /api` - API information

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

3. Fill in your environment variables in `.env.development`

4. Run database migrations (see `src/db/migrations/README.md`)

5. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm start` - Run production server
- `npm run dev` - Run development server with auto-reload (nodemon)

## Environment Variables

See `.env.example` for all available configuration options.

Required variables:
- `OPENAI_API_KEY` - Your OpenAI API key
- `DB_PASSWORD` - Your PostgreSQL password

## Development

The server uses nodemon for auto-reloading during development. Any changes to `.js` files will automatically restart the server.

## Error Handling

All errors are caught by the global error handler (`errorHandler.js`) which:
- Logs errors with full details
- Returns consistent JSON error responses
- Hides internal details in production
- Includes stack traces in development
