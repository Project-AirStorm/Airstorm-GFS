import React from 'react';
import { useState } from 'react';
import './WeatherBoxExtended.css';
import './HourCard/HourCard.js';

const WeatherBoxExtended = ({latitude, longitude, day}) =>{
    return (
        <div className='WeatherBoxExtended'>
            <h3>Detailed forecast for {day.dayOfWeek}, {day.date}</h3>
            {/* You can add HourCard components here when they're ready */}
            {/* <HourCard /> */}
        </div>
    );


};
export default WeatherBoxExtended;