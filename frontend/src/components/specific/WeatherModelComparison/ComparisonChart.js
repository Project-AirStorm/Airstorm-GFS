// src/components/specific/WeatherModelComparison/ComparisonChart.js
import React, { useState, useMemo, useRef } from 'react';
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
import { BsToggleOn, BsToggleOff } from "react-icons/bs"; // Make sure react-icons is installed

// --- Define Colorblind-Friendly Colors ---
const HISTORICAL_COLOR = '#555555'; // Dark Gray/Black
const GRAPHCAST_COLOR = '#0072B2';  // Blue
const NWP_COLOR = '#D55E00';        // Orange/Vermillion
const INACTIVE_COLOR = '#cccccc';  // Lighter Gray

// --- Custom Tooltip --- (remains the same as previous version)
const CustomTooltip = ({ active, payload, unit }) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload;
        const colors = {
            historical: HISTORICAL_COLOR,
            graphcast: GRAPHCAST_COLOR,
            nwp: NWP_COLOR
        };
        return (
        <div className="custom-tooltip">
            <p className="tooltip-label">{`Day ${item.day} (${item.displayDate || item.date})`}</p>
            {payload.map((pld, index) => (
            <p key={index} style={{ color: pld.strokeOpacity < 1 ? INACTIVE_COLOR : (pld.color || colors[pld.dataKey]) }} className="tooltip-value">
                {pld.name}: {pld.value?.toFixed(1) || 'N/A'}{unit}
                {pld.strokeOpacity < 1 && ' (Hidden)'}
            </p>
            ))}
            {item.min !== undefined && item.max !== undefined && (
            <p className="tooltip-value" style={{marginTop: '5px', color: '#666'}}>
                Range: {item.min.toFixed(1)}{unit} - {item.max.toFixed(1)}{unit}
            </p>
            )}
        </div>
        );
    }
    return null;
};

// --- Custom Legend Component with Toggle Icons --- (remains the same as previous version)
const CustomLegend = (props) => {
  const { payload, onClick, lineVisibility } = props;
  const legendStyle = {
    border: '1px solid rgb(229, 231, 235)',
    borderRadius: '0.5rem',
    padding: '1rem',
    backgroundColor: 'rgb(249, 250, 251)',
    marginTop: '20px',
    display: 'inline-block',
  };
  const titleStyle = {
    fontSize: '1rem', fontWeight: 600, color: 'rgb(31, 41, 55)',
    marginBottom: '0.75rem', textAlign: 'center',
    borderBottom: '1px solid rgb(229, 231, 235)', paddingBottom: '0.5rem',
  };
  const listStyle = {
    listStyle: 'none', padding: 0, margin: 0, display: 'flex',
    justifyContent: 'center', gap: '1.5rem',
  };
  const itemStyle = {
    display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.875rem',
  };
  const handleItemClick = (item) => { onClick(item.dataKey); };

  return (
    <div style={legendStyle}>
      <h4 style={titleStyle}>Legend</h4>
      <ul style={listStyle}>
        {payload.map((entry, index) => {
          const dataKey = entry.dataKey;
          const isActive = lineVisibility[dataKey];
          const currentItemStyle = {
             ...itemStyle,
             color: isActive ? 'rgb(75, 85, 99)' : INACTIVE_COLOR,
             opacity: isActive ? 1 : 0.6,
          };
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

// --- Main Comparison Chart Component ---
const ComparisonChart = ({ data, metricName, metricUnit }) => {
  const chartRef = useRef(null);
  const [lineVisibility, setLineVisibility] = useState({
    historical: true,
    graphcast: true,
    nwp: true,
  });

  const maxDay = useMemo(() => {
    return data && data.length > 0 ? Math.max(...data.map(d => d.day)) : 16;
  }, [data]);

  const yDomain = useMemo(() => {
    if (!data || data.length === 0) return [0, 'auto'];
    const visibleKeys = Object.entries(lineVisibility)
                              .filter(([key, value]) => value)
                              .map(([key]) => key);
    const allValues = data.flatMap(d => visibleKeys.map(key => d[key]))
                          .filter(v => v !== null && v !== undefined && !isNaN(v));
    if (allValues.length === 0) return [0, 10];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = Math.max((max - min) * 0.1, 1);
    const domainMin = (min >= 0 && min < padding * 2) ? 0 : Math.floor(min - padding);
    return [domainMin, Math.ceil(max + padding)];
  }, [data, lineVisibility]);

  const fixedXTicks = useMemo(() => {
    const ticks = [];
    for (let i = 1; i <= maxDay; i += 1) {
      ticks.push(i);
    }
    return ticks;
  }, [maxDay]);

  // --- *** Y-Tick Calculation Logic with Small Range Handling *** ---
  const fixedYTicks = useMemo(() => {
    const [min, max] = yDomain;
    if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
        return undefined; // Let Recharts decide if domain is invalid/undetermined
    }

    const domainRange = max - min;
    const TICK_INTERVAL = 2;
    const SMALL_RANGE_THRESHOLD = 12; // If range is less than this, let Recharts decide ticks

    // If the range is too small, forcing ticks every 2 units might cause overlap.
    // In this case (e.g., precipitation), return undefined to let Recharts auto-calculate.
    if (domainRange < SMALL_RANGE_THRESHOLD) {
        return undefined;
    }

    // Otherwise, calculate ticks with the desired interval
    const ticks = [];
    let startTick = Math.ceil(min / TICK_INTERVAL) * TICK_INTERVAL;
     if (startTick > min && startTick - TICK_INTERVAL >= min) {
        startTick -= TICK_INTERVAL;
     } else if (startTick < min) {
        startTick = Math.floor(min / TICK_INTERVAL) * TICK_INTERVAL + TICK_INTERVAL;
     }


    for (let i = startTick; i <= max; i += TICK_INTERVAL) {
       ticks.push(i);
    }

     // Ensure endpoints are considered if needed, adjusting to the step
     if (ticks.length === 0 || (ticks[0] > min && min !== 0) ) {
        ticks.unshift(Math.floor(min / TICK_INTERVAL) * TICK_INTERVAL); // Add nearest lower multiple of interval
     }
      if (ticks.length === 0 || (ticks[ticks.length - 1] < max && max !== 0)) {
         ticks.push(Math.ceil(max / TICK_INTERVAL) * TICK_INTERVAL); // Add nearest higher multiple of interval
      }

     // Filter ticks to be within the calculated domain and remove duplicates
     const finalTicks = [...new Set(ticks)]
                            .filter(tick => tick >= min && tick <= max)
                            .sort((a, b) => a - b);

     // Ensure at least two ticks if possible
     if (finalTicks.length < 2 && max > min) {
        return [min, max].map(t => Math.round(t));
     }

    return finalTicks;
  }, [yDomain]);
  // --- *** End of Y-Tick Calculation Logic *** ---

  const handleLegendClick = (dataKey) => {
    setLineVisibility(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  return (
    <div
      className="analysis-chart comparison-chart-wrapper"
      ref={chartRef}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <h3 className="chart-title">
        {metricName} Forecast Comparison
        <span className="chart-unit">({metricUnit})</span>
      </h3>
      <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={true}
               verticalCoordinatesGenerator={(props) => {
                 const { xAxis } = props;
                 if (xAxis && typeof xAxis.scale === 'function') {
                   return fixedXTicks.map(tick => xAxis.scale(tick));
                 }
                 return [];
               }}
            />

            <XAxis
              dataKey="day"
              name="Day"
              type="number"
              domain={[1, maxDay]}
              ticks={fixedXTicks}
              tickFormatter={(day) => `${day}`}
              label={{ value: 'Day', position: 'insideBottom', offset: -10, fontSize: 14 }}
              allowDecimals={false}
              padding={{ left: 10, right: 10 }}
              interval={0}
            />

            {/* *** YAxis uses the conditional fixedYTicks *** */}
            <YAxis
              domain={yDomain}
              ticks={fixedYTicks} // Use the calculated ticks (might be undefined for small ranges)
              allowDecimals={metricName === 'Precipitation'} // Allow decimals only for Precipitation
              tickFormatter={(value) => metricName === 'Precipitation' ? value.toFixed(1) : Math.round(value)} // Format precip with 1 decimal
              label={{
                value: `${metricName} (${metricUnit})`,
                angle: -90,
                position: 'insideLeft',
                offset: -10,
                fontSize: 14,
                textAnchor: 'middle'
              }}
              // Removed interval={0} - let Recharts skip if needed, especially when ticks is undefined
            />

            <Tooltip content={<CustomTooltip unit={metricUnit} />} />

            <Legend
              content={
                <CustomLegend
                  onClick={handleLegendClick}
                  lineVisibility={lineVisibility}
                />
               }
              verticalAlign="bottom"
              wrapperStyle={{ width: '100%', display: 'flex', justifyContent: 'center', paddingTop: '10px' }}
            />

            {/* Line components remain the same */}
            <Line name="Historical Data (Ground Truth)" dataKey="historical" stroke={HISTORICAL_COLOR} strokeWidth={lineVisibility.historical ? 2 : 1.5} type="monotone" dot={lineVisibility.historical ? { r: 4, strokeWidth: 1 } : false} activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }} connectNulls={false} strokeOpacity={lineVisibility.historical ? 1 : 0.2} isAnimationActive={false}/>
            <Line name="GraphCast Model" dataKey="graphcast" stroke={GRAPHCAST_COLOR} strokeWidth={lineVisibility.graphcast ? 2 : 1.5} type="monotone" dot={lineVisibility.graphcast ? { r: 4, strokeWidth: 1 } : false} activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }} connectNulls={false} strokeOpacity={lineVisibility.graphcast ? 1 : 0.2} isAnimationActive={false}/>
            <Line name="NWP Model" dataKey="nwp" stroke={NWP_COLOR} strokeWidth={lineVisibility.nwp ? 2 : 1.5} type="monotone" dot={lineVisibility.nwp ? { r: 4, strokeWidth: 1 } : false} activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }} connectNulls={false} strokeOpacity={lineVisibility.nwp ? 1 : 0.2} isAnimationActive={false}/>

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