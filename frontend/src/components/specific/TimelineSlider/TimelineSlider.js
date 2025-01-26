// components/TimelineSlider/TimelineSlider.js
import React, { useState, useEffect } from 'react';
import './TimelineSlider.css';

const TimelineSlider = ({ onTimeChange }) => {
  const [timeOffset, setTimeOffset] = useState(0); // Start at current time (0 offset)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Handle time offset change
  const handleTimeChange = (e) => {
    const offset = parseInt(e.target.value);
    setTimeOffset(offset);

    // Calculate the new time based on the offset
    const newTime = new Date(currentTime);
    newTime.setHours(newTime.getHours() + offset);

    // Pass the offset in the format: +<hours> or -<hours>
    const offsetString = offset >= 0 ? `+${offset}hours` : `${offset}hours`;
    onTimeChange(offsetString);
  };

  // Generate labels for the timeline
  const generateTimeLabels = () => {
    const labels = [];
    const now = new Date(currentTime);
    const maxOffset = 16 * 24; // 16 days in hours
    const step = 24; // Show labels every 24 hours (1 day)

    for (let i = -maxOffset; i <= maxOffset; i += step) {
      const time = new Date(now);
      time.setHours(time.getHours() + i);

      labels.push({
        offset: i,
        label: i === 0 ? 'Now' : `${i >= 0 ? '+' : ''}${i / 24} days`,
        position: ((i + maxOffset) / (2 * maxOffset)) * 100,
      });
    }

    return labels;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-labels">
        {generateTimeLabels().map((label, i) => (
          <div
            key={i}
            className="timeline-label"
            style={{ left: `${label.position}%` }}
          >
            <span className="label-text">{label.label}</span>
            <div className="label-marker"></div>
          </div>
        ))}
      </div>
      <input
        type="range"
        min={-16 * 24} // -16 days in hours
        max={16 * 24} // +16 days in hours
        value={timeOffset}
        onChange={handleTimeChange}
        className="timeline-slider"
        step="1" // Allow hourly increments
      />
      <div className="current-time">
        Selected Time:{' '}
        {new Date(currentTime.getTime() + timeOffset * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 16)
          .replace('T', ' ')}
      </div>
    </div>
  );
};

export default TimelineSlider;
