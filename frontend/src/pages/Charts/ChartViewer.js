import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ChartViewer.css';

const ChartViewer = () => {
  const [s3Files, setS3Files] = useState([]);
  const [currentHour, setCurrentHour] = useState(0);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chartId = queryParams.get('chartId');

  useEffect(() => {
    if (!chartId) {
      setError('Chart ID is missing.');
      return;
    }
    // Attempt to read the stored chart data from sessionStorage
    const storedData = sessionStorage.getItem(`chart_${chartId}`);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed && parsed.length > 0) {
          setS3Files(parsed);
          setCurrentHour(0);
        } else {
          setError('No chart data available.');
        }
      } catch (e) {
        setError('Failed to parse chart data.');
      }
    } else {
      setError('No chart data available.');
    }
  }, [chartId]);

  const handleSliderChange = (e) => {
    setCurrentHour(Number(e.target.value));
  };

  return (
    <div className="chart-viewer">
      <h1>Chart Viewer</h1>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {s3Files.length > 0 && (
            <>
              <div className="image-container">
                <img src={s3Files[currentHour]} alt={`Hour ${currentHour}`} />
              </div>
              <input
                type="range"
                min="0"
                max={s3Files.length - 1}
                value={currentHour}
                onChange={handleSliderChange}
                className="hour-slider"
              />
              <div id="hour-display">Hour: {currentHour}</div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChartViewer;
