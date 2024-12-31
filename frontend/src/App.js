import React, { useState } from 'react';
import Footer from './components/common/footer/Footer';
import Header from './components/common/header/Header';
import Sidebar from './components/common/sidebar/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Weather from './pages/Unused/Weather/Weather';
import About from './pages/Unused/About/About';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Get the page title based on current page
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard':
        return 'Dashboard';
      case 'weather':
        return 'Weather';
      case 'maps':
        return 'Maps';
      case 'forecasts':
        return 'Forecasts';
      case 'alerts':
        return 'Alerts';
      case 'analysis':
        return 'Analysis';
      case 'settings':
        return 'Settings';
      case 'logs':
        return 'Logs';
      default:
        return 'Dashboard';
    }
  };

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
      <Sidebar setCurrentPage={setCurrentPage} />
      <Header title={getPageTitle()} />
      {renderPage()}
      <Footer />
    </div>
  );
}

export default App;