import React from 'react';
import { SignIn, SignedOut } from '@clerk/clerk-react';
import './Login.css'; // Your own styling

function Login() {
  return (
    <div className="weather-heatmap-background">
      <div className="login-page-container">
        <main className="login-main">
          {/* The signUpUrl property redirects the user to a custom sign-up page */}
          <SignIn signUpUrl="/sign-up" />
        </main>
      </div>
    </div>
  );
}

export default Login;
