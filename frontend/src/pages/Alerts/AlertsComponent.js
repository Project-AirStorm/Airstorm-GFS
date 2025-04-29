import React, { useState, useEffect } from 'react';
import { UserSession } from '../../utils/UserSession';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import Loader from '../../components/common/loader';

import {
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  ArrowUpDown,
  AlertTriangle,
  ChevronsUp,
  ChevronsDown,
  Copy,
} from 'lucide-react';
import axios from 'axios';
import './Alerts.css';

// Declare URL for Flask API
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const severityColors = {
  Extreme: 'alert-high',
  Severe: 'alert-high',
  Moderate: 'alert-medium',
  Minor: 'alert-low',
  Unknown: 'alert-low',
};

// Create a custom event for alert count updates
export const alertCountUpdated = (count) => {
  window.dispatchEvent(new CustomEvent('alertCountUpdated', { detail: count }));
};

// Alerts Component Variables
const AlertsComponent = () => {
  const { user } = UserSession(); // User session
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [locations, setLocations] = useState([]);
  const [filterCertainty, setFilterCertainty] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(true);
  const [activeView, setActiveView] = useState('overview');
  const [favoriteLocations, setFavoriteLocations] = useState([]);

  // Reset Filters Variables
  const resetFilters = () => {
    setFilterSeverity('all');
    setFilterCertainty('all');
    setFilterLocation('all');
    setSortBy('date');
    setShowFavoritesOnly(true);
    // The locations dropdown options will automatically update due to the useEffect dependency
  };

  // Fetch Alerts
  useEffect(() => {
    const fetchUserLocations = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
        );
        return response.data;
      } catch (err) {
        console.error('Error fetching user locations:', err);
        return [];
      }
    };

    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // Get all user locations
        const userLocations = await fetchUserLocations();
        const favorites = userLocations.filter(
          (location) => location.isFavorite
        );

        const response = await axios.get(
          `${REACT_APP_API_URL}/api/external/alerts?userId=${user.id}`
        );

        if (response.data && response.data.alerts) {
          // Store all alerts but initially show only favorites if showFavoritesOnly is true
          const allAlerts = response.data.alerts;
          const favoriteAlerts = allAlerts.filter((alert) =>
            favorites.some(
              (loc) =>
                loc.latitude === alert.latitude &&
                loc.longitude === alert.longitude
            )
          );

          // Set all alerts in state
          setAlerts(allAlerts);

          // Update alert count based on favorites only (for notification badge)
          alertCountUpdated(favoriteAlerts.length);
        } else {
          setAlerts([]);
          alertCountUpdated(0);
        }
      } catch (err) {
        setError(
          'Failed to fetch alerts: ' +
            (err.response?.data?.error || err.message)
        );
        console.error('Error fetching alerts:', err);
        alertCountUpdated(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [user.id]); // Updated dependencies

  /// Update locations dropdown based on filter setting
  useEffect(() => {
    if (showFavoritesOnly && favoriteLocations.length > 0) {
      // Only include locations that are favorites
      const favoriteLocationNames = favoriteLocations
        .map((loc) => {
          // Find matching alert location names for this favorite
          return alerts
            .filter(
              (alert) =>
                loc.latitude === alert.latitude &&
                loc.longitude === alert.longitude
            )
            .map((alert) => alert.location_name);
        })
        .flat();

      const uniqueFavoriteLocations = [...new Set(favoriteLocationNames)];
      setLocations(uniqueFavoriteLocations);
    } else {
      // Include all locations
      const uniqueLocations = [
        ...new Set(alerts.map((alert) => alert.location_name)),
      ];
      setLocations(uniqueLocations);
    }
  }, [alerts, showFavoritesOnly, favoriteLocations]);

  // Fetch favorite locations
  useEffect(() => {
    const fetchFavoriteLocations = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
        );
        const favorites = response.data.filter((loc) => loc.isFavorite);
        setFavoriteLocations(favorites);
      } catch (err) {
        console.error('Error fetching favorite locations:', err);
      }
    };

    fetchFavoriteLocations();
  }, [user.id]);

  const toggleExpand = (alertId) => {
    setExpandedAlerts((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  };

  const formatDateTime = (dateString) => {
    try {
      return new Date(dateString.replace('Z', '+00:00')).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Copy to clipboard feature
  const copyToClipboard = async (alert, e) => {
    e.stopPropagation(); // Prevent card expansion when clicking copy
    const text = `
Weather Alert: ${alert.event}
Location: ${alert.location_name}
Severity: ${alert.severity}
Certainty: ${alert.certainty}
Start: ${formatDateTime(alert.onset)}
End: ${formatDateTime(alert.expires)}
${alert.headline ? `Headline: ${alert.headline}\n` : ''}
Description: ${alert.description}
${alert.instruction ? `Instructions: ${alert.instruction}` : ''}
  `.trim();

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy alert:', err);
    }
  };

  if (loading) {
    return <Loader size="medium" />;
  }

  if (error) {
    return (
      <div className="alerts-body">
        <div className="alert-item alert-high">
          <div className="alert-header">
            <h3 className="alert-type">Error</h3>
          </div>
          <p className="alert-message">{error}</p>
        </div>
      </div>
    );
  }

  const processedAlerts = alerts
    .filter((alert) => {
      // Filter by favorite status if showFavoritesOnly is true
      const favoriteMatch =
        !showFavoritesOnly ||
        favoriteLocations.some(
          (loc) =>
            loc.latitude === alert.latitude && loc.longitude === alert.longitude
        );

      const severityMatch =
        filterSeverity === 'all' || alert.severity === filterSeverity;
      const locationMatch =
        filterLocation === 'all' || alert.location_name === filterLocation;
      const certaintyMatch =
        filterCertainty === 'all' || alert.certainty === filterCertainty;

      return favoriteMatch && severityMatch && locationMatch && certaintyMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'severity':
          return b.severity.localeCompare(a.severity);
        case 'location':
          return a.location_name.localeCompare(b.location_name);
        default: // 'date'
          return new Date(b.onset || 0) - new Date(a.onset || 0);
      }
    });

  if (loading) {
    return <Loader size="medium" />;
  } 

  if (error) {
    return (
      <div className="alerts-body">
        <div className="alert-item alert-high">
          <div className="alert-header">
            <h3 className="alert-type">Error</h3>
          </div>
          <p className="alert-message">{error}</p>
        </div>
      </div>
    );
  }

  const toggleExpandAll = () => {
    if (Object.keys(expandedAlerts).length === processedAlerts.length) {
      // If all are expanded, collapse all and switch to overview
      setExpandedAlerts({});
      setActiveView('overview'); // Switch to overview when collapsing all
    } else {
      // Expand all and switch to detailed view
      const newExpandedState = {};
      processedAlerts.forEach((alert, index) => {
        newExpandedState[
          `${alert.location_name}-${alert.event}-${index}`
        ] = true;
      });
      setExpandedAlerts(newExpandedState);
      setActiveView('detailed'); // Switch to detailed when expanding all
    }
  };

  

  // Format text with paragraphs
  const formatTextWithParagraphs = (text) => {
    if (!text) return '';
    // Split text by double newlines (paragraphs)
    return text.split(/\n\n+/).map((paragraph, index) => (
      <p key={index} className="alert-paragraph">
        {paragraph.trim()}
      </p>
    ));
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="controls-container">
        <OverviewSwitch
          activeView={activeView}
          onViewChange={(view) => {
            // Set the active view
            setActiveView(view);
            
            // When switching to detailed view, expand all alerts
            if (view === 'detailed') {
              const newExpandedState = {};
              processedAlerts.forEach((alert, index) => {
                newExpandedState[
                  `${alert.location_name}-${alert.event}-${index}`
                ] = true;
              });
              setExpandedAlerts(newExpandedState);
            } else {
              // When switching to overview, collapse all alerts
              setExpandedAlerts({});
            }
          }}
        />

          <ActionButtons
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>
        <div className="alerts-body">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="content-title">Weather Alerts</h2>
              <p className="content-description">
                Active weather alerts for{' '}
                {showFavoritesOnly ? 'your favorited' : 'all'} locations.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  // Reset location filter when toggling view
                  setFilterLocation('all');
                }}
                className="button-toggle flex items-center gap-2"
              >
                {showFavoritesOnly
                  ? 'Show All Locations'
                  : 'Show Favorited Locations'}
              </button>

              <button
                onClick={toggleExpandAll}
                className="button-toggle flex items-center gap-2"
              >
                {Object.keys(expandedAlerts).length === processedAlerts.length ? (
                  <ChevronsUp className="w-4 h-4" />
                ) : (
                  <ChevronsDown className="w-4 h-4" />
                )}
                {Object.keys(expandedAlerts).length === processedAlerts.length
                  ? 'Collapse All'
                  : 'Expand All'}
              </button>

              <button
                onClick={resetFilters}
                className="button-toggle flex items-center gap-2"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="filter-container">
            {/* Severity Filter */}
            <div className="flex items-center flex-1">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="filter-select flex-1"
              >
                <option value="all">All Severities</option>
                <option value="Extreme">Extreme</option>
                <option value="Severe">Severe</option>
                <option value="Moderate">Moderate</option>
                <option value="Minor">Minor</option>
              </select>
            </div>

            {/* Certainty Filter */}
            <div className="flex items-center flex-1">
              <AlertTriangle className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={filterCertainty}
                onChange={(e) => setFilterCertainty(e.target.value)}
                className="filter-select flex-1"
              >
                <option value="all">All Certainties</option>
                <option value="Observed">Observed</option>
                <option value="Likely">Likely</option>
                <option value="Possible">Possible</option>
                <option value="Unlikely">Unlikely</option>
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex items-center flex-1">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="filter-select flex-1"
              >
                <option value="all">
                  {showFavoritesOnly ? 'Favorited Locations' : 'All Locations'}
                </option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center flex-1">
              <ArrowUpDown className="w-4 h-4 text-gray-500 mr-2" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select flex-1"
              >
                <option value="date">Sort by Date</option>
                <option value="severity">Sort by Severity</option>
                <option value="location">Sort by Location</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {processedAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No active alerts for your locations
              </div>
            ) : (
              processedAlerts.map((alert, index) => {
                const alertId = `${alert.location_name}-${alert.event}-${index}`;
                const isExpanded = expandedAlerts[alertId];

                return (
                  <div
                    key={alertId}
                    className={`alert-item ${severityColors[alert.severity]}`}
                    onClick={(e) => {
                      // Only toggle if not clicking the expand button
                      if (!e.target.closest('button')) {
                        toggleExpand(alertId);
                      }
                    }}
                  >
                    <div className="alert-header">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <h3 className="alert-type truncate">{alert.event}</h3>
                        </div>
                        <p className="alert-location flex-shrink-0">
                          {alert.location_name}
                        </p>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`severity-badge ${alert.severity}`}>
                            {alert.severity}
                          </span>
                          <span className="certainty-badge">
                            {alert.certainty}
                          </span>
                          <button
                            onClick={(e) => copyToClipboard(alert, e)}
                            className="p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
                            title="Copy alert to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpand(alertId)}
                        className="p-2 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="alert-details">
                        <div className="alert-metadata">
                          <p>
                            <strong>Start:</strong> {formatDateTime(alert.onset)}
                          </p>
                          <p>
                            <strong>End:</strong> {formatDateTime(alert.expires)}
                          </p>
                          <p>
                            <strong>Sender:</strong> {alert.sender}
                          </p>
                        </div>
                        
                        {alert.headline && (
                          <h4 className="alert-headline">{alert.headline}</h4>
                        )}
                        
                        <div className="alert-description">
                          {formatTextWithParagraphs(alert.description)}
                        </div>
                        
                        {alert.instruction && (
                          <div className="alert-instruction-container">
                            <h4 className="alert-instruction-title">Instructions:</h4>
                            <div className="alert-instruction">
                              {formatTextWithParagraphs(alert.instruction)}
                            </div>
                          </div>
                        )}
                        
                        {alert.url && (
                          <p className="alert-more-info">
                            <a
                              href={alert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 underline"
                            >
                              More Information
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsComponent;