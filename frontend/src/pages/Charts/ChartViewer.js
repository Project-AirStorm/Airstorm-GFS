import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ChartViewer.css';

const ChartViewer = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const chartId = queryParams.get('chartId');
  const lat = queryParams.get('lat');
  const lon = queryParams.get('lon');

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
              <div id="hour-display">Hour: {currentHour}</div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChartViewer;
