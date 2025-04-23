
/* src/components/common/PlaneLoader/PlaneLoader.js */
import React from 'react';
import { BsAirplaneEnginesFill } from 'react-icons/bs';
import './planeloader.css';

/**
 * PlaneLoader: a plane flying in a circle with fading trails
 */
const PlaneLoader = () => {
  const trails = Array.from({ length: 8 });

  return (
    <div className="plane-loader">
      <div className="rotator">
        {trails.map((_, i) => (
          <div key={i} className="trail" />
        ))}
        <div className="plane">
          <BsAirplaneEnginesFill />
        </div>
      </div>
    </div>
  );
};

export default PlaneLoader;

/* usage: import PlaneLoader from '.../PlaneLoader'; then <PlaneLoader /> */
