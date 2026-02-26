// src/components/specific/WeatherModelComparison/ErrorMetrics.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  BarChart, Bar, XAxis, YAxis, Cell, ReferenceLine, ResponsiveContainer, Tooltip
} from 'recharts';

// Colors (Keep consistent)
const GRAPHCAST_COLOR = '#0072B2';  // Blue
const NWP_COLOR = '#D55E00';        // Orange/Vermillion

/**
 * Component to display error metrics comparison between models, styled with CSS classes.
 */
const ErrorMetrics = ({ selectedMetric, errorMetrics, metricLabel, location }) => {

  // Helper to get metric value or a default (e.g., 0 or null)
  const getMetricValue = (model, metricType) => {
    return errorMetrics?.[selectedMetric]?.[model]?.[metricType] ?? null;
  };

  // Prepare data for charts, handling null values gracefully
  const rmseData = [
    { name: 'GraphCast', value: getMetricValue('graphcast', 'rmse') },
    { name: 'NWP', value: getMetricValue('nwp', 'rmse') }
  ].filter(d => d.value !== null); // Filter out nulls if necessary for display

  const maeData = [
    { name: 'GraphCast', value: getMetricValue('graphcast', 'mae') },
    { name: 'NWP', value: getMetricValue('nwp', 'mae') }
  ].filter(d => d.value !== null);

  const accData = [
    { name: 'GraphCast', value: getMetricValue('graphcast', 'acc') },
    { name: 'NWP', value: getMetricValue('nwp', 'acc') }
  ].filter(d => d.value !== null);


  // Generate comparison summary tag (logic remains similar, classes updated)
  const getMetricComparisonSummary = (metricType, higherIsBetter = false) => {
    const graphcastValue = getMetricValue('graphcast', metricType);
    const nwpValue = getMetricValue('nwp', metricType);

    if (graphcastValue === null || nwpValue === null) {
      return <div className="metric-comparison-tag metric-comparison-nodata">Data unavailable</div>;
    }

    const difference = graphcastValue - nwpValue;
    const tolerance = 0.01; // Tolerance for floating point comparison

    if (Math.abs(difference) < tolerance) {
      return <div className="metric-comparison-tag metric-comparison-similar">Similar Performance</div>;
    }

    const isGraphcastBetter = higherIsBetter ? difference > 0 : difference < 0;

    // Use the 'worse' value as the baseline for percentage calculation
    const referenceValue = higherIsBetter
        ? Math.min(graphcastValue, nwpValue)
        : Math.max(graphcastValue, nwpValue);

    if (referenceValue === 0) {
         // If baseline is 0, can't calculate percentage diff meaningfully
         return (
             <div className={`metric-comparison-tag ${isGraphcastBetter ? 'metric-comparison-graphcast' : 'metric-comparison-nwp'}`}>
                 {isGraphcastBetter ? 'GraphCast Better' : 'NWP Better'} (Zero Baseline)
             </div>
         );
    }


    const percentDifference = Math.abs((difference / referenceValue) * 100);

    // Only show percentage if difference is meaningful (e.g., > 1%)
    if (percentDifference < 1.0) {
        return <div className="metric-comparison-tag metric-comparison-similar">Similar Performance</div>;
    }

    return (
      <div className={`metric-comparison-tag ${isGraphcastBetter ? 'metric-comparison-graphcast' : 'metric-comparison-nwp'}`}>
        {isGraphcastBetter ? 'GraphCast better by ' : 'NWP better by '}
        {percentDifference.toFixed(1)}%
      </div>
    );
  };

  // Custom Tooltip for Bar Charts
  const BarTooltip = ({ active, payload, label, metricName }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip"> {/* Reuse tooltip style */}
          <p className="tooltip-label">{`${label} - ${metricName}`}</p>
          <p className="tooltip-value" style={{ color: payload[0].fill }}>
             {`${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };


  return (
    // This component is now part of a larger card, so internal structure is simpler
    <div className="error-metrics-section">
      <h3 className="error-metrics-main-title">Model Performance Metrics</h3>
      <p className="error-metrics-location-info">
         Displaying metrics for: {location?.name || 'Selected Location'} ({location?.lat?.toFixed(2)}, {location?.lon?.toFixed(2)})
       </p>

      {/* RMSE Chart */}
      <div className="error-metric-block">
        <h4 className="error-metric-title">Root Mean Square Error (RMSE)</h4>
        {rmseData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={60}> {/* Reduced height */}
              <BarChart data={rmseData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}/>
                <Tooltip content={<BarTooltip metricName="RMSE" />} cursor={{ fill: '#f3f4f6' }}/>
                <Bar dataKey="value" barSize={20} radius={[4, 4, 4, 4]}>
                   {rmseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'GraphCast' ? GRAPHCAST_COLOR : NWP_COLOR} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {getMetricComparisonSummary('rmse')}
          </>
        ) : (
            <p className="metric-no-data">RMSE data not available.</p>
        )}
      </div>


      {/* MAE Chart */}
      <div className="error-metric-block">
        <h4 className="error-metric-title">Mean Absolute Error (MAE)</h4>
         {maeData.length > 0 ? (
          <>
             <ResponsiveContainer width="100%" height={60}>
               <BarChart data={maeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}/>
                 <Tooltip content={<BarTooltip metricName="MAE" />} cursor={{ fill: '#f3f4f6' }}/>
                 <Bar dataKey="value" barSize={20} radius={[4, 4, 4, 4]}>
                    {maeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'GraphCast' ? GRAPHCAST_COLOR : NWP_COLOR} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
            {getMetricComparisonSummary('mae')}
          </>
         ) : (
            <p className="metric-no-data">MAE data not available.</p>
         )}
      </div>

      {/* ACC Chart */}
      <div className="error-metric-block">
        <h4 className="error-metric-title">Anomaly Correlation Coefficient (ACC)</h4>
         {accData.length > 0 ? (
            <>
               <ResponsiveContainer width="100%" height={60}>
                 <BarChart data={accData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                   {/* Domain fixed to [0, 1] for ACC */}
                   <XAxis type="number" domain={[0, 1]} hide />
                   <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}/>
                   <Tooltip content={<BarTooltip metricName="ACC" />} cursor={{ fill: '#f3f4f6' }}/>
                   {/* Optional: Reference line for 'good' ACC */}
                   {/* <ReferenceLine x={0.7} stroke="#9ca3af" strokeDasharray="2 2" /> */}
                   <Bar dataKey="value" barSize={20} radius={[4, 4, 4, 4]}>
                     {accData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'GraphCast' ? GRAPHCAST_COLOR : NWP_COLOR} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
              {getMetricComparisonSummary('acc', true)}
            </>
         ) : (
             <p className="metric-no-data">ACC data not available.</p>
         )}
      </div>

       {/* Simplified Summary Text */}
       <div className="metric-summary">
         <p className="summary-text">
           Lower RMSE/MAE and higher ACC indicate better model performance for <span className="summary-metric-label">{metricLabel.toLowerCase()}</span> predictions against historical data.
         </p>
       </div>

    </div>
  );
};

ErrorMetrics.propTypes = {
  selectedMetric: PropTypes.string.isRequired,
  errorMetrics: PropTypes.object.isRequired,
  metricLabel: PropTypes.string.isRequired,
  location: PropTypes.object // Can be null if no location selected
};

export default ErrorMetrics;