import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {SignedIn} from "@clerk/clerk-react";
import Login from './pages/Login/Login';
import Signup from './pages/Singup/Signup';
import './App.css';
import { ROUTES } from './config/Routes';
import Layout from './components/common/Layout/Layout';

function App() {
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
