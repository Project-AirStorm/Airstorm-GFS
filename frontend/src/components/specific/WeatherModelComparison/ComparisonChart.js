// src/components/specific/WeatherModelComparison/ComparisonChart.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// Custom tooltip component
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

const ComparisonChart = ({ data, metricName, metricUnit }) => {
  const chartRef = useRef(null);
  const chartMounted = useRef(false);
  
  // Determine chart parameters based on data
  const maxDay = useMemo(() => {
    return data && data.length > 0 ? Math.max(...data.map(d => d.day)) : 16;
  }, [data]);
  
  // Create hardcoded ticks based on forecast length
  const fixedTicks = useMemo(() => {
    if (maxDay >= 15) {
      return [1, 3, 5, 7, 9, 11, 13, 15]; // 16-day forecast
    } else if (maxDay >= 9) {
      return [1, 3, 5, 7, 9]; // 10-day forecast
    } else {
      return [1, 3, 5, 7]; // 7-day forecast
    }
  }, [maxDay]);
  
  // Apply styling after the chart is fully rendered
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartMounted.current = true;
    
    // One-time fix for tick visibility after the initial render
    const timeoutId = setTimeout(() => {
      const tickElements = chartRef.current.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick');
      if (!tickElements || tickElements.length === 0) return;
      
      tickElements.forEach(tick => {
        const tickText = tick.querySelector('text');
        if (!tickText) return;
        
        const dayText = tickText.textContent.trim();
        const dayNumber = parseInt(dayText.replace('Day ', ''), 10);
        
        // Check if this tick should be visible
        if (isNaN(dayNumber) || !fixedTicks.includes(dayNumber)) {
          tick.style.display = 'none';
        } else {
          tick.style.display = '';
        }
      });
    }, 300); // A single delayed execution

    // Setup resize handler
    const resizeObserver = new ResizeObserver(() => {
      // Only apply the tick visibility fix once the chart is resized
      setTimeout(() => {
        if (chartRef.current) {
          const tickElements = chartRef.current.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick');
          if (!tickElements || tickElements.length === 0) return;
          
          tickElements.forEach(tick => {
            const tickText = tick.querySelector('text');
            if (!tickText) return;
            
            const dayText = tickText.textContent.trim();
            const dayNumber = parseInt(dayText.replace('Day ', ''), 10);
            
            if (isNaN(dayNumber) || !fixedTicks.includes(dayNumber)) {
              tick.style.display = 'none';
            } else {
              tick.style.display = '';
            }
          });
        }
      }, 100);
    });
    
    if (chartRef.current) {
      resizeObserver.observe(chartRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      chartMounted.current = false;
    };
  }, [fixedTicks, data]); // Only re-run when data or ticks change

  return (
    <div 
      className="analysis-chart comparison-chart-wrapper" 
      ref={chartRef}
    >
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
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={true}
              verticalCoordinatesGenerator={
                (props) => {
                  // Generate coordinates for grid lines at each tick position
                  const { xAxis, width } = props;
                  return fixedTicks.map(tick => xAxis.scale(tick));
                }
              }
            />
            
            <XAxis 
              dataKey="day" 
              name="Day" 
              type="number"
              domain={[1, maxDay]}
              ticks={fixedTicks}
              tickFormatter={(day) => `Day ${day}`}
              label={{ 
                value: 'Day', 
                position: 'insideBottom', 
                offset: -5,
                fontSize: 14
              }}
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
              iconSize={16}
              iconType="line"
              formatter={(value, entry, index) => {
                // Custom class names for different legend items
                let customClassName = "";
                if (value.includes("Historical")) {
                  customClassName = "recharts-legend-item-historical";
                } else if (value.includes("GraphCast")) {
                  customClassName = "recharts-legend-item-graphcast";
                } else if (value.includes("NWP")) {
                  customClassName = "recharts-legend-item-nwp";
                }
                
                // Return the legend item with custom class
                return <span className={customClassName}>{value}</span>;
              }}
              wrapperStyle={{
                position: "relative",
                top: -20
              }}
              onClick={null} // Disable click handler
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