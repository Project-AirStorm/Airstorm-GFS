// Forecasts.js
import PropTypes from 'prop-types';
import OverviewSwitch from '../../components/specific/OverviewSwitch/OverviewSwitch';
import ActionButtons from '../../components/specific/ActionButtons/ActionButtons';
import GraphCastForecast from '../../components/specific/GraphCastForecast/GraphCastForecast';
import './Forecasts.css';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { UserSession } from '../../utils/UserSession';
import WeatherBox from '../../components/specific/WeatherBox/WeatherBox';

/**
 * Forecasts page component that displays weather forecasts and predictions
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Forecasts component
 */

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const Forecasts = ({ setCurrentPage }) => {
  const { user } = UserSession(); // User session
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const defaultLocation = {
    latitude: 32.385219,
    longitude: -93.762035
    };

    React.useEffect(() => {
      if ('geolocation' in navigator) {
        const options = {
          timeout: 10000, // 10 seconds timeout
        };
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            setLoading(false);
          },
          
          (error) => {
            setError('Unable to retrieve your location');
            console.error('Error retrieving location:', error);
            setLoading(false);
            setUserLocation(defaultLocation);
          },
          options // Pass the timeout options
        );
          }
          else{
            console.error('Geolocation is not supported by your browser');
            setError('Geolocation is not supported by your browser');
            setLoading(false);

        }

      }
    )

    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (error) {
      return <div>{error}</div>;
    } 
  
  
  /*
    const fetchLocations = useCallback(async () => {
      try {
        const response = await axios.get(`${REACT_APP_API_URL}/api/locations`, {
          params: { userId: user.id },
        });
  
        // Add background colors to locations
        const backgroundColors = ['#DDDDDD', '#B0B0B0'];
        const locationsWithStyles = response.data.map((loc, index) => ({
          ...loc,
          backgroundColor: backgroundColors[index % 2],
        }));
  
        setLocations(locationsWithStyles);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to fetch locations');
        setLoading(false);
      }
    }, [user.id]);

    useEffect(() => {
        fetchLocations();
      }, [fetchLocations]);

      const handleDeleteLocation = async (latitude, longitude) => {
          try {
            await axios.delete(`${REACT_APP_API_URL}/api/locations`, {
              data: {
                userId: user.id,
                latitude,
                longitude,
              },
            });
            // Refresh locations after deletion
            fetchLocations();
          } catch (err) {
            console.error('Error deleting location:', err);
          }
        };
  */
  return (

    <div className="forecast-container">
      <div className="main-content2">
        
        {/* View Toggle and Action Buttons */}
        {
          /*
          <div className="controls-container">
          <OverviewSwitch
            activeView={activeView}
            onViewChange={setActiveView}
          />

          <ActionButtons
            onTimeframeChange={() => console.log('Timeframe changed')}
            onAddBase={() => console.log('Add base clicked')}
            timeframe="Week"
          />
        </div>
        */
        }

        <div className='locationLabel'>
              Location: Latitude: {userLocation.latitude} Longitude: {userLocation.longitude}
            </div>
        </div>
        
        {/* Vertical scrolling weather grid */}
      <div className="weather-grid-vertical">    
          <WeatherBox
            key={`${userLocation.latitude}-${userLocation.longitude}`}
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
          />
      </div>

          
         {        
          /*
          <div className="forecasts-body">
          <div className="forecasts-content">
            <h2 className="content-title">Weather Forecasts</h2>
            <p className="content-description">
              Comprehensive weather forecasts and predictions for monitored
              locations.
            </p>
            <GraphCastForecast />
          </div>
        </div>*/
        } 

      </div>
  );
};

// Forecasts.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired
// };

export default Forecasts;

