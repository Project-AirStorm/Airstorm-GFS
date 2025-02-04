import React, { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
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

// Pull in the publishable key from your .env
const PUBLISHABLE_KEY = process.env.REACT_APP_VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key');
}

/**
 * Layout component that wraps the main content and handles mobile menu state
 */
const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle mobile menu toggle
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
 */
function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router>
        <Routes>
          {/* Login route (no Layout) */}
          <Route path={ROUTES.Login.path} element={<ROUTES.Login.element />} />

          {/* Routes wrapped in Layout */}
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  {/* Redirect root to the dashboard */}
                  <Route
                    path="/"
                    element={<Navigate to={ROUTES.dashboard.path} replace />}
                  />

                  {/* Dynamically generate routes */}
                  {Object.values(ROUTES)
                    .filter((route) => route.path !== '/login') // Exclude /login from Layout
                    .map(({ path, element: Element }) => (
                      <Route key={path} path={path} element={<Element />} />
                    ))}

                  {/* Catch-all route */}
                  <Route
                    path="*"
                    element={<Navigate to={ROUTES.dashboard.path} replace />}
                  />
                </Routes>
              </Layout>
            }
          />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;
