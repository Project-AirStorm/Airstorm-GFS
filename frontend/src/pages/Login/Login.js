import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import './Login.css'; // Your own styling

function Login() {
  return (
    <div className="login-page-container">
      <main className="login-main">        
        <SignIn
          path="/login"
          routing="path"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
          appearance={{
            variables: {
              colorPrimary: '#4f46e5',
              // ...any brand colors or font overrides
            },
            elements: {
              rootBox: 'clerk-root',
              formButtonPrimary: 'clerk-btn-primary',
              // ...
            },
          }}
        />
      </main>
    </div>
  );
}

export default Login;
