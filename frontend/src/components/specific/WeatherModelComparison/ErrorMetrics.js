// src/components/specific/WeatherModelComparison/ErrorMetrics.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

/**
 * Component to display error metrics comparison between models
 */
const ErrorMetrics = ({ selectedMetric, errorMetrics, metricLabel, location }) => {
  /**
   * Generate a summary comparison tag for error metrics
   * For RMSE and MAE, lower is better; for ACC, higher is better
   * 
   * @param {string} metricType - Type of metric (rmse, mae, acc)
   * @param {boolean} higherIsBetter - Whether higher values are better (true for ACC)
   * @returns {JSX.Element|null} Comparison summary tag
   */
  const getMetricComparisonSummary = (metricType, higherIsBetter = false) => {
    const graphcastValue = errorMetrics[selectedMetric]?.graphcast?.[metricType];
    const nwpValue = errorMetrics[selectedMetric]?.nwp?.[metricType];
    
    // Check if we have valid values for comparison
    if (graphcastValue === undefined || 
        nwpValue === undefined || 
        graphcastValue === 0 || 
        nwpValue === 0) {
      return null;
    }
    
    // For RMSE and MAE, lower is better; for ACC, higher is better
    const isGraphcastBetter = higherIsBetter 
      ? graphcastValue > nwpValue 
      : graphcastValue < nwpValue;
    
    // Reference value for percentage calculation
    const referenceValue = higherIsBetter 
      ? (isGraphcastBetter ? nwpValue : graphcastValue) // For ACC, use the lower value as reference
      : (isGraphcastBetter ? nwpValue : graphcastValue); // For RMSE/MAE, use the higher value as reference
      
    // Calculate percentage difference
    const percentDifference = Math.abs(
      ((graphcastValue - nwpValue) / referenceValue) * 100
    ).toFixed(1);
    
    // Only show tag if difference is significant (over 1%)
    if (parseFloat(percentDifference) < 1) {
      return (
        <div className="metric-comparison-tag similar">
          Models perform similarly
        </div>
      );
    }
    
    return (
      <div className={`metric-comparison-tag ${isGraphcastBetter ? 'graphcast-better' : 'nwp-better'}`}>
        {isGraphcastBetter ? 'GraphCast better by ' : 'NWP better by '}
        {percentDifference}%
      </div>
    );
  };

  return (
    <div className="analysis-details">
      <h3 className="details-title">Model Performance Metrics</h3>
      <div className="details-subtitle">
        {metricLabel} Comparison Metrics
      </div>
      
      {/* Error metrics visualization */}
      <div className="error-metrics-container">
        <div className="error-metric-chart">
          <h4 className="error-metric-title">
            Root Mean Square Error (RMSE)
          </h4>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={[
                { 
                  name: 'GraphCast', 
                  value: errorMetrics[selectedMetric]?.graphcast?.rmse || 0 
                },
                { 
                  name: 'NWP', 
                  value: errorMetrics[selectedMetric]?.nwp?.rmse || 0 
                }
              ]}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}`, 'RMSE']}
                labelFormatter={() => ''}
              />
              <Bar dataKey="value" nameKey="name">
                {[
                  <Cell key="cell-0" fill="#82ca9d" />,
                  <Cell key="cell-1" fill="#ff7300" />
                ]}
              </Bar>
              <ReferenceLine x={0} stroke="#666" />
            </BarChart>
          </ResponsiveContainer>
          {getMetricComparisonSummary('rmse')}
        </div>
        
        <div className="error-metric-chart">
          <h4 className="error-metric-title">
            Mean Absolute Error (MAE)
          </h4>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={[
                { 
                  name: 'GraphCast', 
                  value: errorMetrics[selectedMetric]?.graphcast?.mae || 0 
                },
                { 
                  name: 'NWP', 
                  value: errorMetrics[selectedMetric]?.nwp?.mae || 0 
                }
              ]}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}`, 'MAE']}
                labelFormatter={() => ''}
              />
              <Bar dataKey="value" nameKey="name">
                {[
                  <Cell key="cell-0" fill="#82ca9d" />,
                  <Cell key="cell-1" fill="#ff7300" />
                ]}
              </Bar>
              <ReferenceLine x={0} stroke="#666" />
            </BarChart>
          </ResponsiveContainer>
          {getMetricComparisonSummary('mae')}
        </div>
        
        <div className="error-metric-chart">
          <h4 className="error-metric-title">
            Anomaly Correlation Coefficient (ACC)
          </h4>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={[
                { 
                  name: 'GraphCast', 
                  value: errorMetrics[selectedMetric]?.graphcast?.acc || 0 
                },
                { 
                  name: 'NWP', 
                  value: errorMetrics[selectedMetric]?.nwp?.acc || 0 
                }
              ]}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value) => [`${value.toFixed(2)}`, 'ACC']}
                labelFormatter={() => ''}
              />
              <Bar dataKey="value" nameKey="name">
                {[
                  <Cell key="cell-0" fill="#82ca9d" />,
                  <Cell key="cell-1" fill="#ff7300" />
                ]}
              </Bar>
              <ReferenceLine x={0.7} stroke="#666" strokeDasharray="3 3" />
            </BarChart>
          </ResponsiveContainer>
          {getMetricComparisonSummary('acc', true)}
        </div>
      </div>
      
      {/* Performance summary */}
      <div className="metric-summary">
        <h4 className="summary-title">Performance Summary</h4>
        <p className="summary-text">
          This visualization compares actual weather measurements with model forecasts.
          The data shows how GraphCast (AI-based) and traditional NWP models perform
          for {metricLabel.toLowerCase()} prediction using historical data as ground truth.
        </p>
        <p className="data-note">
          Data shown for location: {location.name} ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})
        </p>
      </div>
    </div>
  );
};

ErrorMetrics.propTypes = {
  selectedMetric: PropTypes.string.isRequired,
  errorMetrics: PropTypes.object.isRequired,
  metricLabel: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired
};

export default ErrorMetrics;