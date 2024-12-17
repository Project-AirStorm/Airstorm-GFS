import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Homepage = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch the homepage message from Flask backend
    axios
      .get('http://localhost:5001/home')
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error('Error fetching JSON', error);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <main className="flex-grow container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-purple-300">
          {message || 'Welcome to Airstorm'}
        </h1>
        <p className="mt-6 text-center text-purple-200">
          Your gateway to precise weather insights and forecasts.
        </p>
      </main>
    </div>
  );
};

export default Homepage;
