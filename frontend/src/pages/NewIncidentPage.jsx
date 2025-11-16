/**
 * New Incident Page
 *
 * Purpose: Form to create a new incident
 * Route: /incidents/new
 *
 * Features:
 * - Form with title, severity, and description fields
 * - Validation before submission
 * - Shows loading state while creating
 * - Redirects to detail page on success
 * - Shows error if creation fails
 *
 * State flow:
 * 1. User fills form → Update state on each change
 * 2. User submits → Validate inputs
 * 3. Call createIncident() API
 * 4. Show loading indicator
 * 5. On success → Redirect to detail page
 * 6. On error → Show error message
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createIncident } from '../services/incidentsApi';
import './NewIncidentPage.css';

function NewIncidentPage() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    severity: 'medium', // Default to medium
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle input changes
   * Updates form state as user types
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return false;
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters');
      return false;
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null);

    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Call API to create incident
      const newIncident = await createIncident(formData);

      console.log('Incident created:', newIncident);

      // Redirect to the new incident's detail page
      navigate(`/incidents/${newIncident.id}`);

    } catch (err) {
      console.error('Failed to create incident:', err);
      setError(err.message || 'Failed to create incident');
      setLoading(false);
    }
  };

  return (
    <div className="new-incident-page">
      <div className="page-header">
        <Link to="/" className="back-link">
          ← Back to Incidents
        </Link>
      </div>

      <h1>Create New Incident</h1>
      <p className="page-description">
        Describe the incident below. AI will automatically generate a summary, root cause
        suggestions, and a customer-friendly status message.
      </p>

      <form onSubmit={handleSubmit} className="incident-form">
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">
            Incident Title <span className="required">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., API Gateway returning 502 errors"
            required
            disabled={loading}
            className="form-input"
          />
          <p className="help-text">
            Brief, descriptive title for this incident
          </p>
        </div>

        {/* Severity */}
        <div className="form-group">
          <label htmlFor="severity">
            Severity <span className="required">*</span>
          </label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            required
            disabled={loading}
            className="form-input"
          >
            <option value="low">Low - Minor issue, low impact</option>
            <option value="medium">Medium - Moderate impact</option>
            <option value="high">High - Critical issue, major impact</option>
          </select>
          <p className="help-text">
            How severe is this incident?
          </p>
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description & Error Logs <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the incident in detail. Include error messages, logs, timestamps, affected services, and any other relevant context..."
            required
            disabled={loading}
            className="form-input"
            rows={10}
          />
          <p className="help-text">
            Provide as much detail as possible. The AI will use this to generate analysis.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Creating & Analyzing...
              </>
            ) : (
              'Create Incident'
            )}
          </button>
        </div>

        {/* Loading message */}
        {loading && (
          <div className="loading-message">
            <p>Creating incident and generating AI analysis...</p>
            <p className="loading-subtext">This may take a few seconds.</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default NewIncidentPage;
