import React from 'react';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <main className="flex-grow container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-purple-300 mb-10">
          About Airstorm GFS
        </h1>
        <div className="max-w-2xl mx-auto text-center text-purple-200">
          <p className="mb-6">
            Airstorm is a cutting-edge weather information platform designed to
            provide precise, real-time meteorological insights.
          </p>
          <p className="mb-6">
            Our mission is to deliver accurate and comprehensive weather
            forecasts to help you make informed decisions.
          </p>
          <p>Stay prepared, stay informed with Airstorm.</p>
        </div>
      </main>
    </div>
  );
};

export default About;
