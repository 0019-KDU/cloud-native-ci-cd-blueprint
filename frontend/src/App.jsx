/**
 * App Component - Main Application Router
 *
 * Purpose: Sets up routing for the entire application
 *
 * Routes:
 * - / → IncidentsListPage (home page, shows all incidents)
 * - /incidents/new → NewIncidentPage (create new incident)
 * - /incidents/:id → IncidentDetailPage (view incident details)
 *
 * This uses React Router for client-side routing, meaning:
 * - No page reloads when navigating
 * - Browser back/forward buttons work
 * - Can share/bookmark URLs
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import IncidentsListPage from './pages/IncidentsListPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import NewIncidentPage from './pages/NewIncidentPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">AI Incident Assistant</h1>
            <p className="app-subtitle">DevOps Incident Management with AI-Powered Analysis</p>
          </div>
        </header>

        {/* Main content */}
        <main className="app-main">
          <Routes>
            {/* Home page - List all incidents */}
            <Route path="/" element={<IncidentsListPage />} />

            {/* Create new incident - MUST come before /:id */}
            <Route path="/incidents/new" element={<NewIncidentPage />} />

            {/* View incident detail */}
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />

            {/* 404 Not Found - catch all other routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>
            Powered by OpenAI | Built with React, Express & PostgreSQL
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

/**
 * 404 Not Found Page
 */
function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary">
        Go Home
      </a>
    </div>
  );
}

export default App;
