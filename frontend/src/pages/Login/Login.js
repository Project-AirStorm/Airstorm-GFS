import React from 'react';
import { SignIn, SignedOut } from '@clerk/clerk-react';
import './Login.css'; // Your own styling

function Login() {
  return (
    <div className="weather-heatmap-background">
      <div className="login-page-container">
        <main className="login-main">
          {/* If the user is a first time user, and has not been 
              authetnicated through Clerk, they can click the 'Sign up' button on 
              the <SignIn> component, which it handles via the signUpUrl property and 
              redirects the user to our custom sign-up page */}
          <SignIn signUpUrl="/sign-up" />
        </main>
      </div>
    </div>
  );
}

export default Login;
