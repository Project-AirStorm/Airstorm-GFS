import React, { useState } from 'react';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Weather from './pages/Weather';
import About from './pages/About';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'weather':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'maps':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'forecasts':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'alerts':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'analysis':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'settings':
        return <Weather setCurrentPage={setCurrentPage} />;
      case 'logs':
        return <Weather setCurrentPage={setCurrentPage} />;
      default:
        return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {renderPage()}
      <Footer />
    </div>
  );
}

export default App;