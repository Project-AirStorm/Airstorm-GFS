import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Login from './pages/Login/Login';
import Signup from './pages/Singup/Signup';
import './App.css';
import { ROUTES } from './config/Routes';
import Layout from './components/common/Layout/Layout';
import { UserSession } from './utils/UserSession';

function App() {

  // Currently here for testing purposes, will be removed
  // This is the user info we will be saving to the DB.
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
        {/* Public sign-in routes that are only available to users
            that have not been authenticated by Clerk yet  */}
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<Signup />} />

        {/* These are our "fallback routes." If The user tries to 
            Type in anything after projectairstorm.com/asdf, this 
            redirects the React router to the /login page. */}
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

        {/* Protected application routes! These are only accessible Clerk login has been 
            authenticated and the user is signed in. 
            Our entire application is wrapped in the <Layout> Component. */}
        <Route
          element={
            <>
              <SignedIn>
                <Layout>
                  <Routes>
                    {/* Dynamically generates all proctected application routes from 
                        the ROUTES are in Routes.js */}
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
          <Route path="*" element={<Navigate to={ROUTES.notfound.path} replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
