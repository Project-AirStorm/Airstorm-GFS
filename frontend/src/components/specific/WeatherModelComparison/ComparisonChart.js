// src/components/specific/WeatherModelComparison/ComparisonChart.js
import React, { useState, useEffect, useRef } from 'react';
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

// Custom tooltip component remains the same...
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
  // Add significant state management
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [forceRender, setForceRender] = useState(0);
  const chartContainerRef = useRef(null);
  const chartMounted = useRef(false);
  
  // Determine chart parameters based on data
  const maxDay = data && data.length > 0 ? Math.max(...data.map(d => d.day)) : 16;
  
  // Create hardcoded ticks based on forecast length
  const getFixedTicks = () => {
    if (maxDay >= 15) {
      return [1, 3, 5, 7, 9, 11, 13, 15]; // 16-day forecast
    } else if (maxDay >= 9) {
      return [1, 3, 5, 7, 9]; // 10-day forecast
    } else {
      return [1, 3, 5, 7]; // 7-day forecast
    }
  };
  
  const fixedTicks = getFixedTicks();
  
  // Function to directly manipulate DOM to hide unwanted ticks
  const enforceTickVisibility = () => {
    if (!chartContainerRef.current) return;
    
    const tickElements = chartContainerRef.current.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick');
    if (!tickElements || tickElements.length === 0) return;
    
    // Loop through all tick elements
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
  };
  
  // Initial setup and cleanup
  useEffect(() => {
    // Create a style element to add CSS directly to the document
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.innerHTML = `
      /* Override Recharts styling for this component only */
      .comparison-chart-wrapper .recharts-cartesian-axis-tick:nth-child(even) {
        display: none !important;
      }
      
      /* Make sure tick lines align with grid lines */
      .comparison-chart-wrapper .recharts-cartesian-grid-vertical line {
        stroke-opacity: 1;
      }
    `;
    document.head.appendChild(styleEl);
    
    chartMounted.current = true;
    
    return () => {
      document.head.removeChild(styleEl);
      chartMounted.current = false;
    };
  }, []);
  
  // Handle chart size changes and trigger renders
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Create a sequence of delayed renders to ensure proper layout
    const renderSequence = [50, 150, 300, 600];
    
    // Set up render timers
    const timers = renderSequence.map((delay, index) => 
      setTimeout(() => {
        if (chartMounted.current) {
          setForceRender(prev => prev + 1);
          if (delay >= 300) {
            // After the chart has had time to render, fix ticks
            enforceTickVisibility();
          }
        }
      }, delay)
    );
    
    // Create a ResizeObserver to detect size changes
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setChartSize({ width, height });
        // Delayed enforcement of tick visibility after resize
        setTimeout(enforceTickVisibility, 100);
      }
    });
    
    // Start observing the chart container
    resizeObserver.observe(chartContainerRef.current);
    
    // Clean up timers and observer
    return () => {
      timers.forEach(timer => clearTimeout(timer));
      resizeObserver.disconnect();
    };
  }, [data, maxDay]); // Re-run when data or max day changes
  
  // Re-run enforceTickVisibility when forced render happens
  useEffect(() => {
    if (forceRender > 0) {
      enforceTickVisibility();
    }
  }, [forceRender]);

  return (
    <div 
      className="analysis-chart comparison-chart-wrapper" 
      ref={chartContainerRef}
      // Add a unique key to force complete re-renders when necessary
      key={`chart-${maxDay}-${forceRender}`}
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
              // Ensure vertical grid lines align with ticks
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
          
            // Update in ComparisonChart.js
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