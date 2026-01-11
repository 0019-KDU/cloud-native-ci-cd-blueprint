import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import IncidentsListPage from './pages/IncidentsListPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import NewIncidentPage from './pages/NewIncidentPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">AI Incident Assistant</h1>
            <p className="app-subtitle">DevOps Incident Management with AI-Powered Analysis | v5.5</p>
          </div>
          <nav className="app-nav">
            <Link to="/" className="nav-link">Incidents</Link>
            <Link to="/analytics" className="nav-link">Analytics</Link>
            <Link to="/incidents/new" className="nav-link nav-link-primary">+ New Incident</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<IncidentsListPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/incidents/new" element={<NewIncidentPage />} />
            <Route path="/incidents/:id" element={<IncidentDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>
            Powered by OpenAI | Built with React, Express & PostgreSQL
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

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
