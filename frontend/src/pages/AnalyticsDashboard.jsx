/**
 * Analytics Dashboard Page
 *
 * Purpose: Displays metrics and visualizations about incidents
 * Used by: Main app routing
 *
 * Features:
 * - Metric cards showing totals (total incidents, open, resolved, closed)
 * - Pie chart for severity distribution
 * - Bar chart for status breakdown
 * - Real-time data from backend analytics endpoint
 */

import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/analyticsApi';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-message">Loading analytics data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-message">
          <h2>Failed to Load Analytics</h2>
          <p>{error}</p>
          <button onClick={loadAnalytics} className="btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <div className="error-message">No analytics data available</div>
      </div>
    );
  }

  const { byStatus, bySeverity, totals } = analytics;

  // Calculate totals for metric cards
  const totalIncidents = totals?.total || 0;
  const openCount = totals?.open_count || 0;
  const resolvedCount = totals?.resolved_count || 0;
  const closedCount = totals?.closed_count || 0;

  // Prepare data for charts
  const severityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  const statusColors = {
    open: '#3b82f6',
    investigating: '#8b5cf6',
    resolved: '#10b981',
    closed: '#6b7280'
  };

  // Calculate percentages for pie chart
  const severityTotal = bySeverity.reduce((sum, item) => sum + item.count, 0);
  const severityWithPercentages = bySeverity.map(item => ({
    ...item,
    percentage: severityTotal > 0 ? (item.count / severityTotal * 100).toFixed(1) : 0
  }));

  // Find max count for bar chart scaling
  const maxStatusCount = Math.max(...byStatus.map(item => item.count), 1);

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p className="dashboard-subtitle">
          Real-time insights into your incident management
        </p>
        <button onClick={loadAnalytics} className="btn btn-refresh">
          Refresh Data
        </button>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card metric-card-total">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3 className="metric-label">Total Incidents</h3>
            <p className="metric-value">{totalIncidents}</p>
          </div>
        </div>

        <div className="metric-card metric-card-open">
          <div className="metric-icon">🔴</div>
          <div className="metric-content">
            <h3 className="metric-label">Open</h3>
            <p className="metric-value">{openCount}</p>
          </div>
        </div>

        <div className="metric-card metric-card-resolved">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3 className="metric-label">Resolved</h3>
            <p className="metric-value">{resolvedCount}</p>
          </div>
        </div>

        <div className="metric-card metric-card-closed">
          <div className="metric-icon">🔒</div>
          <div className="metric-content">
            <h3 className="metric-label">Closed</h3>
            <p className="metric-value">{closedCount}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Severity Distribution - Pie Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Incidents by Severity</h2>
          <div className="pie-chart-container">
            <div className="pie-chart">
              {severityWithPercentages.map((item, index) => {
                const prevPercentages = severityWithPercentages
                  .slice(0, index)
                  .reduce((sum, prev) => sum + parseFloat(prev.percentage), 0);

                return (
                  <div
                    key={item.severity}
                    className="pie-slice"
                    style={{
                      '--percentage': `${item.percentage}%`,
                      '--rotation': `${prevPercentages * 3.6}deg`,
                      '--color': severityColors[item.severity]
                    }}
                  />
                );
              })}
            </div>
            <div className="pie-chart-legend">
              {severityWithPercentages.map(item => (
                <div key={item.severity} className="legend-item">
                  <span
                    className="legend-color"
                    style={{ backgroundColor: severityColors[item.severity] }}
                  />
                  <span className="legend-label">
                    {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                  </span>
                  <span className="legend-value">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Breakdown - Bar Chart */}
        <div className="chart-card">
          <h2 className="chart-title">Incidents by Status</h2>
          <div className="bar-chart-container">
            <div className="bar-chart">
              {byStatus.map(item => {
                const barHeight = (item.count / maxStatusCount * 100);
                return (
                  <div key={item.status} className="bar-item">
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: statusColors[item.status]
                        }}
                      >
                        <span className="bar-value">{item.count}</span>
                      </div>
                    </div>
                    <div className="bar-label">
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="dashboard-footer">
        <p className="footer-text">
          Last updated: {new Date(analytics.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
