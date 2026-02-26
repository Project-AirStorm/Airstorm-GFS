import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import './App.css';
import { ROUTES } from './config/Routes';
import Layout from './components/common/Layout/Layout';
import ChartViewer from './pages/Charts/ChartViewer';
import { UserProvider } from './contexts/UserContext';
import { cleanClerkUrlParams } from './utils/clerkUtils';

function App() {
  // Call the utility function
  cleanClerkUrlParams();

  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Publicly declared login/sign-up routes that are only available to users
              that have not been authenticated by Clerk yet. */}
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<Signup />} />


          {/* Separate route for ChartViewer that is NOT wrapped in Layout */}
          <Route path="/chart-viewer" element={<ChartViewer />} />

          {/* These are our public "fallback routes." If the user tries to 
              type in anything after projectairstorm.com/asdf, this 
              reroutes the user to the /login page. */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Navigate to={ROUTES.dashboard.path} replace />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            }
          />

          {/* Protected application routes! 
            These are only accessible Clerk login has been authenticated and the user is signed in. 
            Our entire application is wrapped in the <Layout> Component. */}
          <Route
            element={
              <>
                <SignedIn>
                  <Layout>
                    <Routes>
                      {/* Dynamically generates all protected application routes from 
                          the ROUTES array in Routes.js */}
                      {Object.values(ROUTES).map(({ path, element: Element }) => (
                        <Route key={path} path={path} element={<Element />} />
                      ))}
                    </Routes>
                  </Layout>
                </SignedIn>
                <SignedOut>
                  <Navigate to="/login" replace />
                </SignedOut>
              </>
            }
          >
            <Route
              path="*"
              element={<Navigate to={ROUTES.notfound.path} replace />}
            />
          </Route>
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;