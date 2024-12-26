import React, { useRef, useEffect } from 'react';
import './map.css';

const Weather = () => {
  const mapContainer = useRef(null);

  useEffect(() => {
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframe.src =
      'https://api.maptiler.com/maps/6fc667a0-09bd-4b69-bd77-1ce5af52e91b/?key=SSva5warkCQmDREzBt3V#-0.2/0.00000/141.02679';

    if (mapContainer.current) {
      mapContainer.current.appendChild(iframe);
    }

    return () => {
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen">
      <div ref={mapContainer} className="h-full w-full" />
    </div>
  );
};

export default Weather;
