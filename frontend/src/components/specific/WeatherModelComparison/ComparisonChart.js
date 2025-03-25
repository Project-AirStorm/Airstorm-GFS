// src/components/specific/WeatherModelComparison/ComparisonChart.js
import React from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * Custom tooltip for the comparison chart
 */
const CustomTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{`Day ${item.day} (${item.displayDate || item.date})`}</p>
        <p className="tooltip-value">Historical (Ground Truth): {item.historical?.toFixed(1) || 'N/A'}{unit}</p>
        <p className="tooltip-value">GraphCast: {item.graphcast?.toFixed(1) || 'N/A'}{unit}</p>
        <p className="tooltip-value">NWP: {item.nwp?.toFixed(1) || 'N/A'}{unit}</p>
        {item.min !== undefined && item.max !== undefined && (
          <p className="tooltip-value">Range: {item.min.toFixed(1)}{unit} - {item.max.toFixed(1)}{unit}</p>
        )}
      </div>
    );
  }
  
  return null;
};

/**
 * Comparison chart component that displays the model comparison
 */
const ComparisonChart = ({ data, metricName, metricUnit }) => {
  return (
    <div className="analysis-chart">
      <h3 className="chart-title">
        {metricName} Forecast Comparison
        <span className="chart-unit">({metricUnit})</span>
      </h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              name="Day" 
              type="number"
              domain={[1, 'dataMax']}
              tickFormatter={(day) => `Day ${day}`}
              label={{ 
                value: 'Day', 
                position: 'insideBottom', 
                offset: -5,
                fontSize: 14
              }}
              interval={Math.ceil(data.length / 10)}
              allowDecimals={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis 
              label={{ 
                value: `${metricName} (${metricUnit})`, 
                angle: -90, 
                position: 'insideLeft',
                offset: -5,
                fontSize: 14
              }}
            />
            <Tooltip content={<CustomTooltip unit={metricUnit} />} />
            <Legend 
  verticalAlign="top" 
  align="center"
  height={60}
  iconSize={14}
  iconType="plainline"
  layout="horizontal"
  margin={{ top: 0, right: 0, left: 0, bottom: 20 }}
/>
            <Line 
              name="Historical Data (Ground Truth)" 
              dataKey="historical" 
              stroke="#8884d8" 
              strokeWidth={2}
              type="monotone"
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
              connectNulls={false}
            />
            <Line 
              name="GraphCast Model" 
              dataKey="graphcast" 
              stroke="#82ca9d" 
              strokeWidth={2}
              strokeDasharray="5 5"
              type="monotone"
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
              connectNulls={false}
            />
            <Line 
              name="NWP Model" 
              dataKey="nwp" 
              stroke="#ff7300" 
              strokeWidth={2}
              strokeDasharray="3 3"
              type="monotone"
              dot={{ r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

ComparisonChart.propTypes = {
  data: PropTypes.array.isRequired,
  metricName: PropTypes.string.isRequired,
  metricUnit: PropTypes.string.isRequired
};

export default ComparisonChart;