/**
 * Incident Detail Page
 *
 * Purpose: Shows full details of a single incident, including all AI-generated fields
 * Route: /incidents/:id
 *
 * Features:
 * - Loads incident by ID from URL parameter
 * - Shows all incident fields: title, severity, description
 * - Shows AI analysis: summary, root causes, customer message
 * - Copy-to-clipboard for customer message
 * - Back button to return to list
 *
 * State flow:
 * 1. Component mounts → Extract ID from URL
 * 2. Call getIncident(id) API
 * 3. Update state with incident data
 * 4. Render detailed view
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getIncident } from '../services/incidentsApi';
import './IncidentDetailPage.css';

function IncidentDetailPage() {
  const { id } = useParams(); // Get ID from URL parameter
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false); // For "copied!" feedback

  // Load incident when component mounts or ID changes
  useEffect(() => {
    async function loadIncident() {
      try {
        setLoading(true);
        setError(null);

        const data = await getIncident(id);
        setIncident(data);

      } catch (err) {
        console.error('Failed to load incident:', err);
        setError(err.message || 'Failed to load incident');
      } finally {
        setLoading(false);
      }
    }

    loadIncident();
  }, [id]); // Re-run if ID changes

  /**
   * Copy customer message to clipboard
   */
  const copyCustomerMessage = async () => {
    if (!incident?.ai_customer_message) return;

    try {
      await navigator.clipboard.writeText(incident.ai_customer_message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  /**
   * Format timestamp
   */
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Get severity badge class
   */
  const getSeverityClass = (severity) => {
    return `severity-badge severity-${severity}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="incident-detail-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading incident details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="incident-detail-page">
        <div className="error-message">
          <h2>Error Loading Incident</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Back to Incidents
            </button>
            <button onClick={() => window.location.reload()} className="btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!incident) {
    return (
      <div className="incident-detail-page">
        <div className="error-message">
          <h2>Incident Not Found</h2>
          <p>The incident with ID {id} does not exist.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Incidents
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="incident-detail-page">
      {/* Header */}
      <div className="page-header">
        <Link to="/" className="back-link">
          ← Back to Incidents
        </Link>
        <div className="incident-meta">
          <span className="incident-id">#{incident.id}</span>
          <span className={getSeverityClass(incident.severity)}>
            {incident.severity}
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="incident-title">{incident.title}</h1>

      {/* Metadata */}
      <div className="incident-dates">
        <div>
          <strong>Created:</strong> {formatDate(incident.created_at)}
        </div>
        <div>
          <strong>Updated:</strong> {formatDate(incident.updated_at)}
        </div>
      </div>

      {/* Original Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <div className="description-box">
          {incident.description}
        </div>
      </section>

      {/* AI Summary */}
      <section className="detail-section">
        <h2>AI Summary</h2>
        <div className="ai-content summary">
          {incident.ai_summary || <em>No summary available</em>}
        </div>
      </section>

      {/* AI Root Causes */}
      <section className="detail-section">
        <h2>Possible Root Causes</h2>
        {incident.ai_root_causes && incident.ai_root_causes.length > 0 ? (
          <ul className="root-causes-list">
            {incident.ai_root_causes.map((cause, index) => (
              <li key={index}>{cause}</li>
            ))}
          </ul>
        ) : (
          <em>No root causes identified</em>
        )}
      </section>

      {/* Customer Message */}
      <section className="detail-section">
        <div className="section-header">
          <h2>Customer-Friendly Status Message</h2>
          <button
            onClick={copyCustomerMessage}
            className="btn btn-small"
            disabled={!incident.ai_customer_message}
          >
            {copied ? '✓ Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
        <div className="ai-content customer-message">
          {incident.ai_customer_message || <em>No customer message available</em>}
        </div>
        <p className="help-text">
          This message is suitable for public status pages or customer communications.
        </p>
      </section>
    </div>
  );
}

export default IncidentDetailPage;
