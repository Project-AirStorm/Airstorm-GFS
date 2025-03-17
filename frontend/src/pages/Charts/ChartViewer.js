import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ChartViewer.css';

const ChartViewer = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chartId = queryParams.get('chartId');
  const lat = queryParams.get('lat');
  const lon = queryParams.get('lon');
  // "start" should be passed as the chart creation datetime (ISO string)
  const startParam = queryParams.get('start');
  // If no start parameter, default to current time (but in production, you should pass it)
  const forecastStart = startParam ? new Date(startParam) : new Date();
  
  const [s3Files, setS3Files] = useState([]);
  const [currentHour, setCurrentHour] = useState(0);
  const [error, setError] = useState('');
  const [preloadedImages, setPreloadedImages] = useState([]);

  useEffect(() => {
    if (!chartId) {
      setError('Chart ID is missing.');
      return;
    }
    // Retrieve s3Files from sessionStorage using the chartId key.
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

  // Preload images for a smoother slider experience
  useEffect(() => {
    if (!s3Files || s3Files.length === 0) return;

    const preloadImages = async () => {
      try {
        const promises = s3Files.map(src =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
          })
        );
        const images = await Promise.all(promises);
        setPreloadedImages(images);
      } catch (err) {
        setError(err.message);
      }
    };

    preloadImages();
  }, [s3Files]);

  const handleSliderChange = (e) => {
    setCurrentHour(Number(e.target.value));
  };

  // Compute the forecast time for the current slider position.
  // The forecast time is calculated as forecastStart plus the hour offset.
  // We keep minutes from forecastStart, but zero-out seconds.
  const getForecastTime = () => {
    const forecastTime = new Date(forecastStart.getTime() + currentHour * 3600000);
    // Zero out seconds and milliseconds (keeping the minutes from the creation time)
    forecastTime.setSeconds(0, 0);

    // Format the time (e.g., "15:00 UTC Friday, March 14, 2025")
    const timeStr = forecastTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    });
    const dateStr = forecastTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
    return `${timeStr} UTC ${dateStr}`;
  };

  return (
    <div className="chart-viewer">
      <h1>
        ({lat}, {lon})
      </h1>
      {error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          {preloadedImages.length > 0 && (
            <>
              <div className="image-container">
                <img src={preloadedImages[currentHour].src} alt={`Hour ${currentHour}`} />
              </div>
              <input
                type="range"
                min="0"
                max={preloadedImages.length - 1}
                value={currentHour}
                onChange={handleSliderChange}
                className="hour-slider"
              />
              <div id="hour-display">{getForecastTime()}</div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChartViewer;
