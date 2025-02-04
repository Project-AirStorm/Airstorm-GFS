import { ClerkProvider } from '@clerk/clerk-react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ROUTES } from './config/Routes';
import './App.css';
import Layout from './components/common/Layout/Layout';

// Pull in the publishable key from your .env
const PUBLISHABLE_KEY = process.env.REACT_APP_VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}


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
                    element={<Navigate to={ROUTES.notfound.path} replace />}
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
