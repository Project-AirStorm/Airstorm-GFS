import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  MapPin,
  ArrowUpDown,
  AlertTriangle,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';
import axios from 'axios';
import './Alerts.css';

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
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [locations, setLocations] = useState([]);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [filterCertainty, setFilterCertainty] = useState('all');

  // Reset Filters Variables
  const resetFilters = () => {
    setFilterSeverity('all');
    setFilterCertainty('all');
    setFilterLocation('all');
    setSortBy('date');
  };

  // Fetch Favorite Locations
  const fetchFavoriteLocations = async () => {
    try {
      const userId = process.env.REACT_APP_USER_ID;
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(
        `${baseUrl}/api/locations?userId=${userId}`
      );
      return response.data.filter((location) => location.isFavorite);
    } catch (err) {
      console.error('Error fetching favorite locations:', err);
      return [];
    }
  };

  // Fetch Alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // First get favorite locations
        const favorites = await fetchFavoriteLocations();
        setFavoriteLocations(favorites);

        // Then get alerts
        const userId = process.env.REACT_APP_USER_ID;
        const baseUrl =
          process.env.REACT_APP_API_URL || 'http://localhost:5001';
        const response = await axios.get(
          `${baseUrl}/api/external/alerts?userId=${userId}`
        );

        if (response.data && response.data.alerts) {
          // Filter alerts to only include favorite locations
          const favoriteAlerts = response.data.alerts.filter((alert) =>
            favorites.some(
              (loc) =>
                loc.latitude === alert.latitude &&
                loc.longitude === alert.longitude
            )
          );
          setAlerts(favoriteAlerts);

          // Update alert count
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
  }, []);

  /// Only update the locations state with favorite locations
  useEffect(() => {
    const uniqueLocations = [
      ...new Set(alerts.map((alert) => alert.location_name)),
    ];
    setLocations(uniqueLocations);
  }, [alerts]);

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

  // Filter and Sort Alerts
  const processedAlerts = alerts
    .filter((alert) => {
      const severityMatch =
        filterSeverity === 'all' || alert.severity === filterSeverity;
      const locationMatch =
        filterLocation === 'all' || alert.location_name === filterLocation;
      const certaintyMatch =
        filterCertainty === 'all' || alert.certainty === filterCertainty;
      return severityMatch && locationMatch && certaintyMatch;
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
    return (
      <div className="alerts-body">
        <div className="text-center py-8">Loading alerts...</div>
      </div>
    );
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
      // If all are expanded, collapse all
      setExpandedAlerts({});
    } else {
      // Expand all
      const newExpandedState = {};
      processedAlerts.forEach((alert, index) => {
        newExpandedState[
          `${alert.location_name}-${alert.event}-${index}`
        ] = true;
      });
      setExpandedAlerts(newExpandedState);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="content-title">Weather Alerts</h2>
          <p className="content-description">
            Active weather alerts for your saved locations
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleExpandAll}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            {Object.keys(expandedAlerts).length === processedAlerts.length ? (
              <>
                <ChevronsUp className="w-4 h-4" />
                Collapse All
              </>
            ) : (
              <>
                <ChevronsDown className="w-4 h-4" />
                Expand All
              </>
            )}
          </button>

          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Severity Filter */}
        <div className="w-full bg-gray-900 border border-gray-600 rounded flex items-center">
          <Filter className="w-4 h-4 text-white mx-2" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-transparent text-white p-2 outline-none appearance-none"
          >
            <option value="all">All Severities</option>
            <option value="Extreme">Extreme</option>
            <option value="Severe">Severe</option>
            <option value="Moderate">Moderate</option>
            <option value="Minor">Minor</option>
          </select>
          <ChevronDown className="w-4 h-4 text-white mx-2" />
        </div>

        {/* Certainty Filter */}
        <div className="w-full bg-gray-900 border border-gray-600 rounded flex items-center">
          <AlertTriangle className="w-4 h-4 text-white mx-2" />
          <select
            value={filterCertainty}
            onChange={(e) => setFilterCertainty(e.target.value)}
            className="w-full bg-transparent text-white p-2 outline-none appearance-none"
          >
            <option value="all">All Certainties</option>
            <option value="Observed">Observed</option>
            <option value="Likely">Likely</option>
            <option value="Possible">Possible</option>
            <option value="Unlikely">Unlikely</option>
          </select>
          <ChevronDown className="w-4 h-4 text-white mx-2" />
        </div>

        {/* Location Filter */}
        <div className="w-full bg-gray-900 border border-gray-600 rounded flex items-center">
          <MapPin className="w-4 h-4 text-white mx-2" />
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="w-full bg-transparent text-white p-2 outline-none appearance-none"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-white mx-2" />
        </div>

        {/* Sort Filter */}
        <div className="w-full bg-gray-900 border border-gray-600 rounded flex items-center">
          <ArrowUpDown className="w-4 h-4 text-white mx-2" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-transparent text-white p-2 outline-none appearance-none"
          >
            <option value="date">Sort by Date</option>
            <option value="severity">Sort by Severity</option>
            <option value="location">Sort by Location</option>
          </select>
          <ChevronDown className="w-4 h-4 text-white mx-2" />
        </div>
      </div>

      <div className="space-y-4">
        {processedAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No active alerts for your locations
          </div>
        ) : (
          processedAlerts.map((alert, index) => (
            <div
              key={`${alert.location_name}-${alert.event}-${index}`}
              className={`rounded-lg p-4 ${
                severityColors[alert.severity] || 'bg-gray-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-semibold">{alert.event}</h3>
                  </div>
                  <p className="text-sm">{alert.location_name}</p>
                  <div className="flex gap-4">
                    <span className="text-sm">Severity: {alert.severity}</span>
                    <span className="text-sm">
                      Certainty: {alert.certainty}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    toggleExpand(
                      `${alert.location_name}-${alert.event}-${index}`
                    )
                  }
                  className="p-2 hover:bg-black/10 rounded-full transition-colors"
                >
                  {expandedAlerts[
                    `${alert.location_name}-${alert.event}-${index}`
                  ] ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {expandedAlerts[
                `${alert.location_name}-${alert.event}-${index}`
              ] && (
                <div className="mt-4 space-y-2">
                  <p>
                    <strong>Start:</strong> {formatDateTime(alert.onset)}
                  </p>
                  <p>
                    <strong>End:</strong> {formatDateTime(alert.expires)}
                  </p>
                  <p>
                    <strong>Sender:</strong> {alert.sender}
                  </p>
                  {alert.headline && (
                    <p className="font-bold">{alert.headline}</p>
                  )}
                  <p>{alert.description}</p>
                  {alert.instruction && (
                    <div className="mt-4">
                      <p className="font-bold">Instructions:</p>
                      <p>{alert.instruction}</p>
                    </div>
                  )}
                  {alert.url && (
                    <p className="mt-2">
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
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsComponent;
