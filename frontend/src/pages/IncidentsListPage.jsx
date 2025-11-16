/**
 * Incidents List Page
 *
 * Purpose: Displays a table/list of all incidents
 * Route: / (home page)
 *
 * Features:
 * - Loads all incidents on mount
 * - Shows loading state while fetching
 * - Displays error if fetch fails
 * - Each row links to incident detail page
 * - Shows severity with color coding
 * - Button to create new incident
 *
 * State flow:
 * 1. Component mounts → useEffect runs
 * 2. Call getIncidents() API
 * 3. Update state with incidents array
 * 4. Render table with incidents
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getIncidents } from '../services/incidentsApi';
import './IncidentsListPage.css';

function IncidentsListPage() {
  // State management
  const [incidents, setIncidents] = useState([]); // Array of incident objects
  const [loading, setLoading] = useState(true);   // Loading indicator
  const [error, setError] = useState(null);        // Error message

  // Load incidents when component mounts
  useEffect(() => {
    async function loadIncidents() {
      try {
        setLoading(true);
        setError(null);

        // Fetch incidents from API
        const data = await getIncidents({ limit: 100, offset: 0 });
        setIncidents(data);

      } catch (err) {
        console.error('Failed to load incidents:', err);
        setError(err.message || 'Failed to load incidents');
      } finally {
        setLoading(false);
      }
    }

    loadIncidents();
  }, []); // Empty dependency array = run once on mount

  /**
   * Get CSS class for severity badge
   */
  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity}`;
  };

  /**
   * Format timestamp to readable date
   */
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Loading state
  if (loading) {
    return (
      <div className="incidents-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading incidents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="incidents-page">
        <div className="error-message">
          <h2>Error Loading Incidents</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="incidents-page">
      <div className="page-header">
        <h1>Incidents</h1>
        <Link to="/incidents/new" className="btn btn-primary">
          Create New Incident
        </Link>
      </div>

      {incidents.length === 0 ? (
        // Empty state
        <div className="empty-state">
          <p>No incidents yet.</p>
          <Link to="/incidents/new" className="btn btn-primary">
            Create Your First Incident
          </Link>
        </div>
      ) : (
        // Incidents table
        <div className="table-container">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Summary</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>{incident.id}</td>
                  <td>
                    <Link to={`/incidents/${incident.id}`} className="incident-title">
                      {incident.title}
                    </Link>
                  </td>
                  <td>
                    <span className={getSeverityClass(incident.severity)}>
                      {incident.severity}
                    </span>
                  </td>
                  <td className="summary-cell">
                    {incident.ai_summary ? (
                      incident.ai_summary.substring(0, 100) +
                      (incident.ai_summary.length > 100 ? '...' : '')
                    ) : (
                      <em>No summary</em>
                    )}
                  </td>
                  <td>{formatDate(incident.created_at)}</td>
                  <td>
                    <Link to={`/incidents/${incident.id}`} className="btn btn-small">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default IncidentsListPage;
