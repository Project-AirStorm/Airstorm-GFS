import React, { useState, useEffect } from 'react';
import Footer from './components/common/footer/Footer';
import Header from './components/common/header/Header';
import Sidebar from './components/common/sidebar/Sidebar';
import Dashboard from './pages/Dashboard/Dashboard';
import Weather from './pages/Unused/Weather/Weather';
import './App.css';

/**
 * Main Application component that handles routing and layout
 * Includes responsive design handling and mobile menu state
 */
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Render the current page content
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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-wrapper">
      <Sidebar 
        setCurrentPage={setCurrentPage}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentPage={currentPage}
      />
      
      <div className="main-content-wrapper">
        <Header 
          title={getPageTitle()} 
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <main className="content-area">
          {renderPage()}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default App;