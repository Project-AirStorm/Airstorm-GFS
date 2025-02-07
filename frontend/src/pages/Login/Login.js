import React from 'react';
import { SignIn, SignedOut } from '@clerk/clerk-react';
import './Login.css'; // Your own styling

function Login() {
  return (
    <div className="login-page-container">
      <main className="login-main">
        {/* The 'signUpUrl' property redirects the user to sign-up route,
            so that we can customize our signup page
            and not use their external API */}
        <SignIn signUpUrl="/sign-up" />
      </main>
    </div>
  );
}

export default Login;
