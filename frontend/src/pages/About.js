import React from 'react';
import { IoAnalytics, IoSpeedometer, IoSync, IoShield } from 'react-icons/io5';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className="flex items-start space-x-4">
      <div className="p-3 bg-purple-500 bg-opacity-20 rounded-lg">
        <Icon className="text-2xl text-purple-300" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-purple-300 mb-2">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  </div>
);

const About = () => {
  const features = [
    {
      icon: IoAnalytics,
      title: 'Advanced AI Integration',
      description:
        'Integration of GraphCast AI for superior weather forecasting capabilities, offering faster and more accurate predictions than traditional models.',
    },
    {
      icon: IoSpeedometer,
      title: 'Real-time Processing',
      description:
        'Up-to-the-minute weather forecasts with significantly improved response times to weather changes, essential for aviation operations.',
    },
    {
      icon: IoSync,
      title: 'Enhanced Prediction',
      description:
        'Advanced prediction capabilities for critical weather phenomena including thunderstorms, icing conditions, and turbulence with enhanced accuracy.',
    },
    {
      icon: IoShield,
      title: 'Military Grade',
      description:
        'Designed for Air Force Global Strike Command (AFGSC) operations, ensuring operational advantages and safeguarding personnel across diverse conditions.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-purple-300 mb-6">
              About Airstorm GFS
            </h1>
            <p className="text-lg text-purple-200 mb-4">
              A cutting-edge weather visualization platform integrating
              GraphCast AI for advanced aviation weather forecasting.
            </p>
            <p className="text-gray-300">
              Designed to enhance AFGSC operational capabilities with real-time,
              accurate weather data crucial for aviation safety and strategic
              decision-making.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-purple-300 mb-4">
              Project Goals
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>
                • Achieve 30% enhancement in medium-range weather forecast
                accuracy
              </p>
              <p>
                • Reduce mission planning and response times by 20% through
                quicker updates
              </p>
              <p>
                • Secure over 80% user adoption rate through intuitive design
              </p>
              <p>
                • Establish leadership in AI-driven military weather forecasting
              </p>
              <p>
                • Reduce personnel training time by 25% compared to current
                systems
              </p>
              <p>
                • Successfully deploy across multiple mission types within the
                first year
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
