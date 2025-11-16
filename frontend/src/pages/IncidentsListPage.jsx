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
import { getIncidents, deleteIncident } from '../services/incidentsApi';
import './IncidentsListPage.css';

function IncidentsListPage() {
  // State management
  const [incidents, setIncidents] = useState([]); // Array of incident objects
  const [loading, setLoading] = useState(true);   // Loading indicator
  const [error, setError] = useState(null);        // Error message
  const [deletingId, setDeletingId] = useState(null); // Track which incident is being deleted

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

  /**
   * Handle incident deletion from list
   */
  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete incident #${id}?\n\n"${title}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      await deleteIncident(id);

      // Remove from local state
      setIncidents(prev => prev.filter(inc => inc.id !== id));

      // Show success message
      alert('Incident deleted successfully');

    } catch (err) {
      console.error('Failed to delete incident:', err);
      alert(`Failed to delete incident: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
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
                <th>Status</th>
                <th>AI Analysis</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => {
                const hasEnhancedAI = incident.ai_metadata && 
                  (incident.ai_metadata.similarPatterns?.length > 0 || 
                   incident.ai_metadata.preventiveMeasures?.length > 0);
                const isFallback = incident.ai_metadata?.fallbackMode;
                const hasActionItems = incident.ai_action_items && incident.ai_action_items.length > 0;

                return (
                  <tr key={incident.id}>
                    <td className="id-cell">{incident.id}</td>
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
                    <td>
                      <span className={`status-badge status-${incident.status || 'open'}`}>
                        {incident.status || 'open'}
                      </span>
                    </td>
                    <td className="ai-analysis-cell">
                      {incident.ai_summary ? (
                        <div className="ai-summary-preview">
                          <div className="summary-text">
                            {incident.ai_summary.substring(0, 120) +
                            (incident.ai_summary.length > 120 ? '...' : '')}
                          </div>
                          <div className="ai-indicators">
                            {hasEnhancedAI && !isFallback && (
                              <span className="ai-badge enhanced" title="Enhanced AI Analysis with patterns & recommendations">
                                🤖 Enhanced
                              </span>
                            )}
                            {isFallback && (
                              <span className="ai-badge fallback" title="Generated using fallback mode">
                                ⚠️ Fallback
                              </span>
                            )}
                            {hasActionItems && (
                              <span className="ai-badge actions" title={`${incident.ai_action_items.length} action items`}>
                                🔧 {incident.ai_action_items.length} actions
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <em>No analysis</em>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(incident.created_at)}</td>
                    <td>
                      <div className="actions-cell">
                        <Link to={`/incidents/${incident.id}`} className="btn btn-small">
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(incident.id, incident.title)}
                          className="btn btn-small btn-delete"
                          disabled={deletingId === incident.id}
                          title="Delete incident"
                        >
                          {deletingId === incident.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default IncidentsListPage;
