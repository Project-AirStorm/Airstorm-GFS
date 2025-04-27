// src/components/specific/WeatherModelComparison/ComparisonChart.js
import React, { useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BsToggleOn, BsToggleOff } from "react-icons/bs";

// Colors (Keep consistent)
const HISTORICAL_COLOR = '#555555'; // Dark Gray/Black
const GRAPHCAST_COLOR = '#0072B2';  // Blue
const NWP_COLOR = '#D55E00';        // Orange/Vermillion
const INACTIVE_COLOR = '#cccccc';  // Lighter Gray

// Custom Tooltip (Keep using the existing class name 'custom-tooltip')
const CustomTooltip = ({ active, payload, unit }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const colors = { historical: HISTORICAL_COLOR, graphcast: GRAPHCAST_COLOR, nwp: NWP_COLOR };
        return (
        <div className="custom-tooltip"> {/* Existing class */}
            <p className="tooltip-label">{`Day ${item.day} (${item.displayDate || item.date})`}</p>
            {payload.map((pld, index) => (
            <p key={index} style={{ color: pld.strokeOpacity < 1 ? INACTIVE_COLOR : (pld.color || colors[pld.dataKey]) }} className="tooltip-value">
                {pld.name}: {pld.value?.toFixed(1) || 'N/A'}{unit}
                {pld.strokeOpacity < 1 && ' (Hidden)'}
            </p>
            ))}
        </div>
        );
    }
    return null;
};

// Custom Legend (Keep using existing class names or inline styles)
const CustomLegend = (props) => {
  const { payload, onClick, lineVisibility } = props;
  // Using inline styles as before, but could be moved to CSS using a class like 'comparison-chart-legend'
  const legendStyle = {
    border: '1px solid #e5e7eb', /* Slightly lighter border */
    borderRadius: '8px', /* Match card rounding */
    padding: '1rem',
    backgroundColor: '#f9fafb', /* Light gray background */
    marginTop: '20px',
    display: 'inline-block',
  };
  const titleStyle = {
    fontSize: '0.9rem', fontWeight: 600, color: '#374151',
    marginBottom: '0.75rem', textAlign: 'center',
    borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem',
  };
  const listStyle = { listStyle: 'none', padding: 0, margin: 0, display: 'flex', justifyContent: 'center', gap: '1.5rem' };
  const itemStyle = { display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem' };
  const handleItemClick = (item) => { onClick(item.dataKey); };

  return (
    <div style={legendStyle} className="comparison-chart-legend"> {/* Add class if moving styles */}
      <h4 style={titleStyle}>Legend</h4>
      <ul style={listStyle}>
        {payload.map((entry, index) => {
          const dataKey = entry.dataKey;
          const isActive = lineVisibility[dataKey];
          const currentItemStyle = { ...itemStyle, color: isActive ? '#4b5563' : INACTIVE_COLOR, opacity: isActive ? 1 : 0.6 };
          const iconColor = isActive ? entry.color : INACTIVE_COLOR;
          return (
            <li key={`item-${index}`} style={currentItemStyle} onClick={() => handleItemClick(entry)}>
              {isActive ?
                <BsToggleOn size={20} color={iconColor} style={{ marginRight: '6px', flexShrink: 0 }} /> :
                <BsToggleOff size={20} color={iconColor} style={{ marginRight: '6px', flexShrink: 0 }} />
              }
              {entry.value}
            </li>
          );
        })}
      </ul>
    </div>
  );
};


// Main Comparison Chart Component
const ComparisonChart = ({ data, metricName, metricUnit }) => {
  const chartRef = useRef(null);
  const [lineVisibility, setLineVisibility] = useState({ historical: true, graphcast: true, nwp: true });

  const maxDay = useMemo(() => data && data.length > 0 ? Math.max(...data.map(d => d.day)) : 16, [data]);

  // Y Domain calculation (remains same)
  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 'auto'];
    const visibleKeys = Object.entries(lineVisibility).filter(([, value]) => value).map(([key]) => key);
    const allValues = data.flatMap(d => visibleKeys.map(key => d[key])).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (allValues.length === 0) return [0, 10];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = Math.max((max - min) * 0.1, 1); // Ensure padding is at least 1
    // Adjust domain logic slightly for better presentation, especially near zero
    let domainMin = Math.floor(min - padding);
    let domainMax = Math.ceil(max + padding);
     // If min is positive and close to zero, start Y axis at 0
     if (min >= 0 && min < padding * 2) {
        domainMin = 0;
     }
     // Ensure range is not zero if min === max
     if (domainMin === domainMax) {
        domainMax += 1;
     }

    return [domainMin, domainMax];
  }, [data, lineVisibility]);


  // X Ticks calculation (remains same)
  const fixedXTicks = useMemo(() => {
    const ticks = [];
    // Show fewer ticks for longer timeframes if needed, e.g., every 2 days
    const interval = maxDay > 10 ? 2 : 1;
    for (let i = 1; i <= maxDay; i += interval) {
      ticks.push(i);
    }
    // Ensure the last day is included if interval > 1
    if (interval > 1 && ticks[ticks.length - 1] < maxDay) {
        ticks.push(maxDay);
    }
    return ticks;
  }, [maxDay]);


   // Y Ticks calculation (remains same)
   const fixedYTicks = useMemo(() => {
       const [min, max] = yDomain;
       if (typeof min !== 'number' || typeof max !== 'number' || min >= max) return undefined;

       const domainRange = max - min;
       // Determine a reasonable number of ticks (e.g., 5-7)
       const targetTickCount = 6;
       let interval = Math.max(1, Math.round(domainRange / targetTickCount));

       // Adjust interval to be 'nice' numbers (e.g., 1, 2, 5, 10)
       if (interval > 2 && interval < 5) interval = 2;
       else if (interval > 5 && interval < 10) interval = 5;
       else if (interval > 10) interval = Math.ceil(interval / 5) * 5; // Round up to nearest 5

        // Special handling for precipitation (small values)
        if (metricName === 'Precipitation' && domainRange <= 5) {
            interval = 0.5; // Use smaller steps
             // Ensure ticks have only one decimal place for precipitation
             const ticks = [];
             let startTick = Math.floor(min / interval) * interval;
             if (startTick < min) startTick += interval; // Ensure start is within or at domain min

             for (let i = startTick; i <= max; i += interval) {
                 ticks.push(parseFloat(i.toFixed(1))); // Format to 1 decimal place
             }
             // Ensure domain boundaries are included if needed
             if (ticks.length === 0 || ticks[0] > min) ticks.unshift(parseFloat(min.toFixed(1)));
             if (ticks.length === 0 || ticks[ticks.length - 1] < max) ticks.push(parseFloat(max.toFixed(1)));
             return [...new Set(ticks)].sort((a, b) => a - b);
        } else if (metricName === 'Precipitation' && domainRange > 5 && domainRange <= 10) {
            interval = 1; // Use steps of 1 if range is moderate
        } else if (metricName !== 'Precipitation') {
            interval = Math.max(1, Math.round(interval)); // Ensure integer interval for others
        }


       const ticks = [];
       let startTick = Math.floor(min / interval) * interval;
        if (startTick < min) {
           startTick += interval;
        }


       for (let i = startTick; i <= max; i += interval) {
           ticks.push(metricName === 'Precipitation' ? parseFloat(i.toFixed(1)) : Math.round(i));
       }

       if (ticks.length === 0 || ticks[0] > min) {
           ticks.unshift(metricName === 'Precipitation' ? parseFloat(min.toFixed(1)) : Math.round(min));
       }
        if (ticks.length === 0 || ticks[ticks.length - 1] < max) {
            ticks.push(metricName === 'Precipitation' ? parseFloat(max.toFixed(1)) : Math.round(max));
        }

       const finalTicks = [...new Set(ticks)].sort((a, b) => a - b);

       // Limit number of ticks if too many calculated
       if (finalTicks.length > 8) {
            const newInterval = Math.ceil(finalTicks.length / targetTickCount);
            return finalTicks.filter((_, index) => index % newInterval === 0);
       }

       return finalTicks;
   }, [yDomain, metricName]);


  const handleLegendClick = (dataKey) => {
    setLineVisibility(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };

  return (
    // Removed comparison-chart-wrapper, assuming parent card handles structure
    <div className="comparison-chart-content" ref={chartRef}>
      <h3 className="comparison-chart-title">
        {metricName} Forecast Comparison
        <span className="comparison-chart-unit">({metricUnit})</span>
      </h3>
      <div className="recharts-responsive-container-wrapper"> {/* Added wrapper div */}
        <ResponsiveContainer width="100%" height={450}> {/* Adjusted height */}
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}> {/* Adjusted margins */}
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
             <XAxis
               dataKey="day" name="Day" type="number"
               domain={[1, maxDay]}
               ticks={fixedXTicks}
               tickFormatter={(day) => `${day}`}
               label={{ value: 'Forecast Day', position: 'insideBottom', offset: -15, fontSize: 12, fill: '#6b7280' }}
               axisLine={{ stroke: '#d1d5db' }}
               tickLine={{ stroke: '#d1d5db' }}
               tick={{ fontSize: 11, fill: '#6b7280' }}
               interval="preserveStartEnd" // Show first and last tick defined in fixedXTicks
               padding={{ left: 10, right: 10 }}
             />
             <YAxis
               domain={yDomain}
               ticks={fixedYTicks}
               allowDecimals={metricName === 'Precipitation'}
               tickFormatter={(value) => metricName === 'Precipitation' ? value.toFixed(1) : Math.round(value)}
               label={{ value: `${metricName} (${metricUnit})`, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: '#6b7280' }}
               axisLine={{ stroke: '#d1d5db' }}
               tickLine={{ stroke: '#d1d5db' }}
               tick={{ fontSize: 11, fill: '#6b7280' }}
               width={50} // Adjust width if needed
             />
            <Tooltip content={<CustomTooltip unit={metricUnit} />} />
            <Legend content={<CustomLegend onClick={handleLegendClick} lineVisibility={lineVisibility} />}
              verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />

            {/* Lines */}
            <Line name="Historical" dataKey="historical" stroke={HISTORICAL_COLOR} strokeWidth={lineVisibility.historical ? 2.5 : 1.5} type="monotone" dot={lineVisibility.historical ? { r: 3, fill: HISTORICAL_COLOR } : false} activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: HISTORICAL_COLOR }} connectNulls={false} strokeOpacity={lineVisibility.historical ? 1 : 0.2} isAnimationActive={false} />
            <Line name="GraphCast" dataKey="graphcast" stroke={GRAPHCAST_COLOR} strokeWidth={lineVisibility.graphcast ? 2.5 : 1.5} type="monotone" dot={lineVisibility.graphcast ? { r: 3, fill: GRAPHCAST_COLOR } : false} activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: GRAPHCAST_COLOR }} connectNulls={false} strokeOpacity={lineVisibility.graphcast ? 1 : 0.2} isAnimationActive={false} />
            <Line name="NWP" dataKey="nwp" stroke={NWP_COLOR} strokeWidth={lineVisibility.nwp ? 2.5 : 1.5} type="monotone" dot={lineVisibility.nwp ? { r: 3, fill: NWP_COLOR } : false} activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: NWP_COLOR }} connectNulls={false} strokeOpacity={lineVisibility.nwp ? 1 : 0.2} isAnimationActive={false} />
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