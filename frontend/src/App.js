import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { SignedIn, useUser } from "@clerk/clerk-react";
import Login from './pages/Login/Login';
import Signup from './pages/Singup/Signup';
import './App.css';
import { ROUTES } from './config/Routes';
import Layout from './components/common/Layout/Layout';
import { UserSession } from './utils/UserSession';

function App() {

  // Currently here for testing purposes, will be removed.
  const { isLoaded, user, isSynced } = UserSession();

  if (isLoaded && user) {
    console.log(user.firstName);
    console.log(user.lastName);
    console.log(user.primaryEmailAddress?.emailAddress);

  } else {
    console.log("User data not loaded yet.");
  }


  return (
    <Router>
      <Routes>
        {/* Public sign-in route (not behind SignedIn) */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />
        {/* Protected application (only show if signed in) */}
        <Route
          path="/*"
          element={
            <SignedIn>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to={ROUTES.dashboard.path} replace />} />
                  {Object.values(ROUTES).map(({ path, element: Element }) => (
                    <Route key={path} path={path} element={<Element />} />
                  ))}
                  <Route path="*" element={<Navigate to={ROUTES.notfound.path} replace />} />
                </Routes>
              </Layout>
            </SignedIn>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
