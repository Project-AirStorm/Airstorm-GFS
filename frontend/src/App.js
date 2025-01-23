import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Footer from './components/common/footer/Footer';
import Header from './components/common/header/Header';
import Sidebar from './components/common/sidebar/Sidebar';
import { ROUTES, getPageTitle } from './config/routes';
import './App.css';

/**
 * Layout component that wraps the main content and handles mobile menu state
 */
const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const location = useLocation();

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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="app-wrapper">
      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="main-content-wrapper">
        <Header
          title={getPageTitle(location.pathname)}
          onMenuToggle={toggleMobileMenu}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="content-area">{children}</main>

        <Footer />
      </div>
    </div>
  );
};

/**
 * Main Application component that handles routing
 * Uses centralized route configuration for better maintainability
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Routes without Layout */}
        <Route path="/login" element={<ROUTES.Login.element />} />

        {/* Routes with Layout */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to={ROUTES.dashboard.path} replace />} />
                
                {/* Dynamically generate routes */}
                {Object.values(ROUTES)
                  .filter((route) => route.path !== '/login') // Excludes /login page 
                  .map(({ path, element: Element }) => (
                    <Route key={path} path={path} element={<Element />} />
                  ))}
                
                {/* Catch-all route */}
                <Route path="*" element={<Navigate to={ROUTES.dashboard.path} replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}


export default App;
