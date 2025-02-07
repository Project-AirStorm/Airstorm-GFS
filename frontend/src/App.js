import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { SignIn, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";

import './App.css';
import { ROUTES } from './config/Routes';
import Layout from './components/common/Layout/Layout';

function App() {
  return (
    <Router>
      <SignedOut>

        <SignIn />
      </SignedOut>

      <SignedIn>
      <Routes>
        /* The main entry points for the application */ 
        <Route path="/*" element={ 
        
          <Layout>
             {/* <UserButton /> */}
              <Routes>
                <Route path="/" element={<Navigate to={ROUTES.dashboard.path} replace />} />
                
                {/* Dynamically generate routes */}
                {Object.values(ROUTES).map(({ path, element: Element }) => (
                  <Route key={path} path={path} element={<Element />} />
                ))}

                <Route path="*" element={<Navigate to={ROUTES.notfound.path} replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
      </SignedIn>
    </Router>
  );
}

export default App;
