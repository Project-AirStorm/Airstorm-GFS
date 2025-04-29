// src/components/specific/WeatherModelComparison/PerformancePieChart.js
import React, { useMemo } from 'react'; // Added useMemo
import PropTypes from 'prop-types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Colors matching other charts
const GRAPHCAST_COLOR = '#0072B2'; // Blue
const NWP_COLOR = '#D55E00';       // Orange/Vermillion
const COLORS = [GRAPHCAST_COLOR, NWP_COLOR];

const FADED_OPACITY = 0.4; // Opacity for the less performing slice

/**
 * Pie chart visualizing which model had better accuracy more often.
 * Fades the slice representing the model that performed worse (fewer days).
 */
const PerformancePieChart = ({ data, metricLabel }) => {

  // Check if data is valid for display
  const totalValue = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);

  // Find the index of the worse performing model (minimum value)
  const worsePerformerIndex = useMemo(() => {
    if (!data || data.length < 2 || totalValue === 0) return -1; // No comparison needed if less than 2 or total is 0
    let minVal = Infinity;
    let minIndex = -1;
    data.forEach((entry, index) => {
      if (entry.value < minVal) {
        minVal = entry.value;
        minIndex = index;
      }
    });
    // Handle tie case - don't fade if values are equal
    if (data.length === 2 && data[0].value === data[1].value) {
        return -1;
    }
    return minIndex;
  }, [data, totalValue]);

  if (!data || data.length === 0 || totalValue === 0) {
    return <p className="pie-chart-no-data">Comparison data unavailable for pie chart.</p>;
  }

  // Custom tooltip formatter
  const renderTooltipContent = (props) => {
    const { payload } = props;
    if (payload && payload.length) {
      const { name, value } = payload[0].payload; // Access payload data correctly
      const percentage = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${name}`}</p>
          <p className="tooltip-value">{`${value} days (${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="performance-pie-chart-container">
      <h4 className="pie-chart-title">
        Model Accuracy Frequency ({metricLabel})
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                // Apply fading effect to the worse performer
                fillOpacity={index === worsePerformerIndex ? FADED_OPACITY : 1}
                stroke={COLORS[index % COLORS.length]} // Add stroke for better definition, especially when faded
                strokeOpacity={index === worsePerformerIndex ? FADED_OPACITY + 0.1 : 1} // Slightly less faded stroke
              />
            ))}
          </Pie>
          <Tooltip content={renderTooltipContent} />
          <Legend
             // Make legend items slightly faded if their corresponding slice is faded
             formatter={(value, entry, index) => (
                <span style={{ color: index === worsePerformerIndex ? '#9ca3af' : '#4b5563', opacity: index === worsePerformerIndex ? 0.7 : 1 }}>
                    {value}
                </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
       <p className="pie-chart-description">
        Shows which model had a lower absolute error more frequently compared to historical data. Faded slice indicates the model that was better less often.
      </p>
    </div>
  );
};

PerformancePieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  metricLabel: PropTypes.string.isRequired,
};

export default PerformancePieChart;