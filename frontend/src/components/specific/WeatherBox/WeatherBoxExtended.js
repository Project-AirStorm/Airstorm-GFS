import React from 'react';
import { useState } from 'react';
import 'WeatherBoxExtended.css';
import './HourCard/HourCard.js';

const WeatherBoxExtended = ({latitude, longitude}) =>{
    return (
        <div className='WeatherBoxExtended'>
            <HourCard/>
        </div>
    )


}