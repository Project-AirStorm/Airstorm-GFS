import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import './Login.css'; // Your own styling

function Login() {
  return (
    <div className="login-page-container">
      <main className="login-main">        
        <SignIn />
      </main>
    </div>
  );
}

export default Login;
