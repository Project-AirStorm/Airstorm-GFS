import React from 'react';
import {
  IoThermometerOutline,
  IoLocationOutline,
  IoStarOutline,
  IoStar,
} from 'react-icons/io5';

const WeatherCard = ({ location, onToggleFavorite }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-start justify-between">
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-purple-300">
            {location.name}
          </h3>
          <button
            onClick={() => onToggleFavorite(location)}
            className="ml-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            {location.isFavorite ? (
              <IoStar className="text-xl" />
            ) : (
              <IoStarOutline className="text-xl" />
            )}
          </button>
        </div>
        <div className="flex items-center mt-2 text-gray-300">
          <IoLocationOutline className="mr-1" />
          <span className="text-sm">
            {location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E
          </span>
        </div>
      </div>
    </div>

    {location.weather && (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <IoThermometerOutline className="text-2xl text-red-400 mr-1" />
            <span className="text-2xl font-bold text-white">
              {location.weather.current_temperature.toFixed(1)}°F
            </span>
          </div>
          <span className="text-sm text-gray-300">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>
    )}
  </div>
);

const WeatherDashboard = ({ locations, onToggleFavorite }) => {
  if (!locations.length) {
    return (
      <div className="text-center text-gray-400">
        No saved locations found. Add locations from the Weather page!
      </div>
    );
  }

  // Filter for favorite locations
  const favoriteLocations = locations.filter((location) => location.isFavorite);

  if (!favoriteLocations.length) {
    return (
      <div className="text-center text-gray-400">
        No favorite locations yet. Star your favorite locations to see them
        here!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {favoriteLocations.map((location, index) => (
        <WeatherCard
          key={`${location.latitude}-${location.longitude}`}
          location={location}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
};

export default WeatherDashboard;
